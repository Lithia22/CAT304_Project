const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const moment = require('moment');
const multer = require('multer');
const { sendPasswordResetEmail } = require('./EmailSender');
const path = require('path');
const fs = require('fs');
const { config } = require('./src/configuration/config');

// --------------------------------
// DIRECTORY SETUP
// --------------------------------
const uploadsDir = path.join(__dirname, 'uploads');
const assetsDir = path.join(__dirname, 'assets', 'medications');

[uploadsDir, assetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  } else {
    console.log(`Directory exists: ${dir}`);
  }
});

// --------------------------------
// DATABASE CONFIG
// --------------------------------
const dbConfig = config.database;

// --------------------------------
// EXPRESS SETUP
// --------------------------------
const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'assets', 'medications'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .png, or .gif files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// --------------------------------
// DATABASE CONNECTION
// --------------------------------
let pool;
async function createConnectionPool() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Database connection pool created successfully');
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
    throw error;
  }
}

// --------------------------------
// VALIDATION FUNCTIONS
// --------------------------------
// Format Malaysian phone numbers to standard format
const formatMalaysianPhoneNumber = (phoneNumber) => {
  const cleanedNumber = phoneNumber.replace(/[^\d]/g, '');
  const formattedPhoneNumber = cleanedNumber.startsWith('0')
    ? `60${cleanedNumber.slice(1)}`
    : (cleanedNumber.startsWith('60') ? cleanedNumber : `60${cleanedNumber}`);

  if (!/^60\d{9,10}$/.test(formattedPhoneNumber)) {
    throw new Error('Invalid Malaysian phone number format');
  }

  return formattedPhoneNumber;
};

// Validate Malaysian IC format
const validateMalaysianIC = (ic_number) => {
  if (!/^\d{12}$/.test(ic_number)) return false;
  const birthDate = ic_number.slice(0, 6);
  const year = parseInt(birthDate.slice(0, 2), 10);
  const month = parseInt(birthDate.slice(2, 4), 10);
  const day = parseInt(birthDate.slice(4, 6), 10);
  const fullYear = year > new Date().getFullYear() % 100 ? 1900 + year : 2000 + year;

  const isValidDate = (y, m, d) => {
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  };

  return isValidDate(fullYear, month, day);
};

// Check password meets requirements
const validatePassword = (password) => {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
};

// Validate employee ID format
const validateEmployeeId = (employee_id) => {
  return /^E10\d{2}$/.test(employee_id);
};

// --------------------------------
// AUTHENTICATION ENDPOINTS
// --------------------------------
// Login: Authenticate users (patient/provider)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, userType } = req.body;
    if (!identifier || !password || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let query;
    let params = [identifier];
    
    if (userType === 'patient') {
      query = 'SELECT id, password FROM patients WHERE ic_number = ? AND ic_number IS NOT NULL';
    } else if (userType === 'provider') {
      query = 'SELECT id, password FROM healthcare_providers WHERE employee_id = ? AND employee_id IS NOT NULL';
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    const [users] = await pool.execute(query, params);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Include userType in response for verification
    res.status(200).json({
      message: 'Login successful',
      userType,
      userId: user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register: Create new patient account
app.post('/api/auth/register/patient', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ic_number, full_name, username, email, password, phone_number } = req.body;

    // Validation
    if (!ic_number || !full_name || !username || !email || !password || !phone_number) {
      throw new Error('Missing required fields');
    }

    if (!validateMalaysianIC(ic_number)) {
      return res.status(400).json({ message: 'Invalid IC Number' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
    }

    let formattedPhoneNumber;
    try {
      formattedPhoneNumber = formatMalaysianPhoneNumber(phone_number);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Check for existing IC number
const [existingICNumber] = await connection.execute(
  'SELECT * FROM patients WHERE ic_number = ?',
  [ic_number]
);

if (existingICNumber.length > 0) {
  return res.status(409).json({ message: 'IC Number already registered' });
}

// Check for existing email
const [existingEmail] = await connection.execute(
  'SELECT * FROM patients WHERE email = ?',
  [email]
);

if (existingEmail.length > 0) {
  return res.status(409).json({ message: 'Email already registered' });
}

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert patient without address
    const [result] = await connection.execute(
      'INSERT INTO patients (ic_number, full_name, username, email, password, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
      [ic_number, full_name, username, email, hashedPassword, formattedPhoneNumber]
    );

    // Get provider with lowest patient count
    const [providers] = await connection.execute(`
      SELECT id FROM healthcare_providers 
      ORDER BY patients_count ASC 
      LIMIT 1
    `);

    if (providers.length === 0) {
      throw new Error('No providers available');
    }

    // Assign patient to provider
    await connection.execute(
      'INSERT INTO patient_provider_assignments (patient_id, provider_id) VALUES (?, ?)',
      [result.insertId, providers[0].id]
    );

    // Update provider's patient count
    await connection.execute(
      'UPDATE healthcare_providers SET patients_count = patients_count + 1 WHERE id = ?',
      [providers[0].id]
    );

    await connection.commit();
    res.status(201).json({ message: 'Patient registered and assigned successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Patient registration error:', error);
    res.status(error.message === 'Missing required fields' ? 400 : 500)
      .json({ message: error.message || 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Register: Create new provider account
app.post('/api/auth/register/provider', async (req, res) => {
  try {
    const { employee_id, username, email, password, phone_number, profession, full_name } = req.body;

    if (!employee_id || !username || !email || !password || !phone_number || !profession || !full_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validateEmployeeId(employee_id)) {
      return res.status(400).json({ message: 'Invalid Employee ID format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
    }

    let formattedPhoneNumber;
    try {
      formattedPhoneNumber = formatMalaysianPhoneNumber(phone_number);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const [existingProviders] = await pool.execute('SELECT * FROM healthcare_providers WHERE employee_id = ?', [employee_id]);
    if (existingProviders.length > 0) {
      return res.status(409).json({ message: 'Employee ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.execute(
      'INSERT INTO healthcare_providers (employee_id, username, email, password, phone_number, profession, full_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, username, email, hashedPassword, formattedPhoneNumber, profession, full_name]
    );

    res.status(201).json({ message: 'Provider registered successfully' });
  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------
// PASSWORD RESET
// --------------------------------
// Send reset code via email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, userType } = req.body;
    console.log('Received request:', { email, userType });

    if (!email || !userType) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Email and user type are required' });
    }

    const table = userType === 'patient' ? 'patients' : 'healthcare_providers';
    console.log('Using table:', table);
    
    // Generate 4-digit code
    const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('Generated reset token:', resetToken);
    
    // Set expiry to 1 minute from now
    const resetTokenExpiry = new Date(Date.now() + 60000);
    console.log('Token expiry set to:', resetTokenExpiry);

    // First verify the email exists
    const [existingUser] = await pool.execute(
      `SELECT email FROM ${table} WHERE email = ?`,
      [email]
    );

    if (existingUser.length === 0) {
      console.log('Email not found:', email);
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Update database with token and expiry
    const query = `UPDATE ${table} SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`;
    console.log('Executing query:', query);
    console.log('Query parameters:', [resetToken, resetTokenExpiry, email]);

    const [result] = await pool.execute(query, [resetToken, resetTokenExpiry, email]);
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      console.log('Update failed - no rows affected');
      return res.status(404).json({ message: 'Failed to update reset token' });
    }
    
    // Send email with reset token
    await sendPasswordResetEmail(email, resetToken);
    console.log('Email sent successfully');
    
    res.status(200).json({ message: 'Reset code sent successfully' });
  } catch (error) {
    console.error('Detailed forgot password error:', error);
    res.status(500).json({ 
      message: 'Failed to send reset code', 
      error: error.message 
    });
  }
});

// Verify reset code validity
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code, userType } = req.body;
    
    if (!email || !code || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const table = userType === 'patient' ? 'patients' : 'healthcare_providers';

    const [users] = await pool.execute(
      `SELECT * FROM ${table} WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()`,
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    res.status(200).json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
});

// Set new password after verification
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword, code, userType } = req.body;
    
    if (!email || !newPassword || !code || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const table = userType === 'patient' ? 'patients' : 'healthcare_providers';

    // Verify code one last time
    const [users] = await pool.execute(
      `SELECT * FROM ${table} WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()`,
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      `UPDATE ${table} SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?`,
      [hashedPassword, email]
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// --------------------------------
// PATIENT INFO
// --------------------------------
// Get patient profile information
app.get('/api/patients/:id', async (req, res) => {
  try {
    console.log('Fetching patient with ID:', req.params.id);
    const [patients] = await pool.execute(
      'SELECT id, username, full_name, phone_number, ic_number FROM patients WHERE id = ? AND ic_number IS NOT NULL',
      [req.params.id]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patients[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if username is available
app.get('/api/check-username', async (req, res) => {
  try {
    const { username, userId } = req.query;
    
    const [existingUser] = await pool.execute(
      'SELECT id FROM patients WHERE username = ? AND id != ?',
      [username, userId]
    );
    
    res.json({ available: existingUser.length === 0 });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update patient profile information
app.put('/api/patients/:id/info', async (req, res) => {
  try {
    const { full_name, username, phone_number } = req.body;
    
    if (!full_name || !username || !phone_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if username is taken by another user
    const [existingUsers] = await pool.execute(
      'SELECT id FROM patients WHERE username = ? AND id != ?',
      [username, req.params.id]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    let formattedPhoneNumber;
    try {
      formattedPhoneNumber = formatMalaysianPhoneNumber(phone_number);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    await pool.execute(
      'UPDATE patients SET full_name = ?, username = ?, phone_number = ? WHERE id = ?',
      [full_name, username, formattedPhoneNumber, req.params.id]
    );
    
    res.json({ message: 'Information updated successfully' });
  } catch (error) {
    console.error('Error updating patient info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// --------------------------------
// ADDRESS MANAGEMENT
// --------------------------------
// Get patient's delivery address
app.get('/api/patients/:id/address', async (req, res) => {
  try {
    const [patient] = await pool.execute(
      'SELECT delivery_add FROM patients WHERE id = ?',
      [req.params.id]
    );
    
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({ address: patient[0].delivery_add });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update patient's delivery address
app.put('/api/patients/:id/address', async (req, res) => {
  try {
    const { address } = req.body;
    const addressObj = JSON.parse(address);
    
    // Validate the address object
    if (!addressObj.recipient_name || !addressObj.phone_number || !addressObj.line1 || 
        !addressObj.state || !addressObj.postcode || !addressObj.city) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }

    await pool.execute(
      'UPDATE patients SET delivery_add = ? WHERE id = ?',
      [address, req.params.id]
    );
    
    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------
// MEDICINES
// --------------------------------
// Get patient's medication history
// app.use('/assets', express.static('assets'));
// Clean up the assets middleware configuration
app.use('/assets', (req, res, next) => {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, express.static(path.join(__dirname, 'assets')));

// Get patient's medication history with expiration filtering
app.get('/api/patients/:id/medications', async (req, res) => {
  try {
    const [patient] = await pool.execute(
      'SELECT id FROM patients WHERE id = ?',
      [req.params.id]
    );
    if (patient.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Modified query to only return active prescriptions
    const [medications] = await pool.execute(`
      SELECT 
        m.med_id,
        m.name AS medication_name,
        m.dosageForm,
        m.dosageStrength,
        m.price,
        DATE_FORMAT(m.expirationDate, '%Y-%m-%d') as expirationDate,
        m.image,
        pm.presc_med_id,
        pm.medication_name AS prescribed_name,
        pm.frequency,
        DATE_FORMAT(pm.presc_date, '%Y-%m-%d') as presc_date,
        DATE_FORMAT(p.expiry_date, '%Y-%m-%d') as prescription_expiry_date
      FROM presc_med pm
      JOIN medicines m ON pm.med_id = m.med_id
      JOIN prescriptions p ON pm.presc_id = p.presc_id
      WHERE pm.patient_id = ?
        AND p.expiry_date >= CURDATE()  /* Only get medications from non-expired prescriptions */
        AND (m.expirationDate IS NULL OR m.expirationDate >= CURDATE())  /* Only get non-expired medications */
      ORDER BY pm.presc_date DESC
    `, [req.params.id]);
    
    // Format dates using moment
    const formattedMedications = medications.map(med => ({
      ...med,
      presc_date: moment(med.presc_date).format('YYYY-MM-DD'),
      expirationDate: moment(med.expirationDate).format('YYYY-MM-DD'),
      prescription_expiry_date: moment(med.prescription_expiry_date).format('YYYY-MM-DD'),
      dosage: `${med.dosageStrength}`
    }));
    
    return res.json(formattedMedications || []);
  } catch (error) {
    console.error('Error:', error);
    console.error('Detailed error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --------------------------------
// CATEGORIED MEDICINES
// --------------------------------
// Get patient's medication history
// Utility function to get the table name based on category
const getMedicineTableName = (category) => {
  const tableMap = {
    'diabetes': 'diabetes_medicines',
    'cardiovascular': 'cardiovascular_medicines',
    'cancer': 'cancer_medicines',
    'kidney': 'kidney_disease_medicines',
    'stroke': 'stroke_medicines',
    'arthritis': 'arthritis_medicines'
  };
  return tableMap[category] || 'medicines';
};

// Unified medicine retrieval endpoint
app.get('/api/unified-medicines', async (req, res) => {
  try {
    const [medicines] = await pool.query('SELECT * FROM medicines ORDER BY category, name');
    res.status(200).json(medicines);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get medicines by category
app.get('/api/unified-medicines/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [medicines] = await pool.query('SELECT * FROM medicines WHERE category = ? ORDER BY name', [category]);
    res.status(200).json(medicines);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// --------------------------------
// DIABETES MEDICINES
// --------------------------------
app.post('/api/medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO diabetes_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all diabetes medications
app.get('/api/medications', async (req, res) => {
  const sql = 'SELECT * FROM diabetes_medicines';

  try {
    const [results] = await pool.query(sql); // Use await for the query
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get single diabetes medication
app.get('/api/medications/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM diabetes_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]); // Use await for the query
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json(results[0]); // Return the first result
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Edit diabetes medication
app.put('/api/medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE diabetes_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE diabetes_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM diabetes_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// --------------------------------
// CARDIOVASCULAR MEDICINES
// --------------------------------
app.post('/api/cardiovascular-medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO cardiovascular_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all cardiovascular medications
app.get('/api/cardiovascular-medications', async (req, res) => {
  const sql = 'SELECT * FROM cardiovascular_medicines';

  try {
    const [results] = await pool.query(sql); // Use await for the query
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get single cardiovascular medication
app.get('/api/cardiovascular-medications/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM cardiovascular_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/cardiovascular-medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE cardiovascular_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE cardiovascular_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/cardiovascular-medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM cardiovascular_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// --------------------------------
// CANCER MEDICINES
// --------------------------------
app.post('/api/cancer-medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO cancer_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all cancer medications
app.get('/api/cancer-medications', async (req, res) => {
  const sql = 'SELECT * FROM cancer_medicines';

  try {
    const [results] = await pool.query(sql); // Use await for the query
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single cancer medication
app.get('/api/cancer-medications/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM cancer_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]); // Use await for the query
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/cancer-medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE cancer_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE cancer_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/cancer-medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM cancer_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------------
// KIDNEY DISEASE MEDICINES
// --------------------------------
app.post('/api/kidney-disease-medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO kidney-disease_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all kidney disease medications
app.get('/api/kidney-disease-medicines', async (req, res) => {
  const sql = 'SELECT * FROM kidney_disease_medicines';

  try {
    const [results] = await pool.query(sql); // Use await for the query
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get single kidney disease medication
app.get('/api/kidney-disease-medicines/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM kidney_disease_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/kidney-disease-medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE kidney-disease_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE kidney-disease_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/kidney-disease-medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM kidney-disease_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// --------------------------------
// STROKE MEDICINES
// --------------------------------
app.post('/api/stroke-medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO stroke_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all stroke medications
app.get('/api/stroke-medications', async (req, res) => {
  const sql = 'SELECT * FROM stroke_medicines';

  try {
    const [results] = await pool.query(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single stroke medication
app.get('/api/stroke-medications/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM stroke_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/stroke-medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE stroke_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE stroke_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/stroke-medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM stroke_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --------------------------------
// ARTHRITIS MEDICINES
// --------------------------------
app.post('/api/arthritis-medications', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;
    let image = null;

    if (req.file) {
      image = `/assets/medications/${req.file.filename}`;
    }

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `INSERT INTO arthritis_medicines 
                 (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch];

    const [result] = await connection.query(sql, values);
    
    await connection.commit();
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// Get all arthritis medications
app.get('/api/arthritis-medications', async (req, res) => {
  const sql = 'SELECT * FROM arthritis_medicines';

  try {
    const [results] = await pool.query(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get single arthritis medication
app.get('/api/arthritis-medications/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM arthritis_medicines WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/arthritis-medications/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch } = req.body;

    if (!name || !quantity || !reorderPoint || !dosageForm || !dosageStrength || !price || !expirationDate || !batch) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let sql;
    let params;

    if (req.file) {
      const image = `/assets/medications/${req.file.filename}`;
      sql = `UPDATE arthritis_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, image = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch, id];
    } else {
      sql = `UPDATE arthritis_medicines 
             SET name = ?, quantity = ?, reorderPoint = ?, dosageForm = ?, 
             dosageStrength = ?, price = ?, expirationDate = ?, batch = ? 
             WHERE id = ?`;
      params = [name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, batch, id];
    }

    const [result] = await connection.query(sql, params);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/arthritis-medications/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const sql = 'DELETE FROM arthritis_medicines WHERE id = ?';

    const [result] = await connection.query(sql, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Medication deleted successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Restock Routes 
// Add restock request
app.post('/api/restocks', async (req, res) => {
  const { id, quantity, status, order_date, expected_delivery_date, category, next_batch, name } = req.body;

  if (!quantity || !status || !order_date || !expected_delivery_date || !category || !next_batch) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields are missing',
      receivedData: req.body,
    });
  }

  let tableName;
  switch (category) {
    case 'cardiovascular': tableName = 'cardiovascular_medicines'; break;
    case 'cancer': tableName = 'cancer_medicines'; break;
    case 'kidney': tableName = 'kidney_disease_medicines'; break;
    case 'stroke': tableName = 'stroke_medicines'; break;
    case 'arthritis': tableName = 'arthritis_medicines'; break;
    default: tableName = 'diabetes_medicines';
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if this is a generated ID case
    const isGeneratedId = id.toString().startsWith('generated-');
    
    // If using generated ID, search by name instead
    const checkSql = isGeneratedId 
      ? `SELECT id FROM ${tableName} WHERE name = ?`
      : `SELECT id FROM ${tableName} WHERE id = ?`;
    
    const checkParam = isGeneratedId ? name : id;

    const [checkResult] = await connection.query(checkSql, [checkParam]);

    if (checkResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: `Medicine not found in ${category} category`
      });
    }

    // Use the actual database ID
    const actualId = checkResult[0].id;

    // Create the restock request without updating medicine quantity
    const restockSql = `
      INSERT INTO RestockingRequests 
      (id, quantity, status, order_date, expected_delivery_date, category, next_batch) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [actualId, quantity, status, order_date, expected_delivery_date, category, next_batch];
    const [restockResult] = await connection.query(restockSql, values);

    await connection.commit();
    
    res.status(200).json({ 
      success: true, 
      message: 'Restocking request created successfully',
      restock_id: restockResult.insertId,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ 
      success: false, 
      message: `Error processing restock request: ${err.message}`
    });
  } finally {
    connection.release();
  }
});


// Modified low stock endpoint to use unified medicines table
app.get('/api/low-stock', async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM medicines 
      WHERE quantity <= reorderPoint
      ORDER BY quantity ASC
    `;

    const [results] = await pool.query(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Low Stock Query Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Modified expiring medications endpoint to use unified medicines table
app.get('/api/expiring', async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dateString = thirtyDaysFromNow.toISOString().split('T')[0];

    const sql = `
      SELECT *
      FROM medicines 
      WHERE expirationDate <= ?
      ORDER BY expirationDate ASC
    `;

    const [results] = await pool.query(sql, [dateString]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Expiring Medications Query Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Modified restock endpoint
app.post('/api/restocks', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id, quantity, status, order_date, expected_delivery_date, category, next_batch } = req.body;

    if (!id || !quantity || !status || !order_date || !expected_delivery_date || !category || !next_batch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields are missing',
        receivedData: req.body,
      });
    }

    const tableName = getMedicineTableName(category);

    // Check if medicine exists
    const [checkResult] = await connection.query(
      `SELECT id FROM ${tableName} WHERE id = ?`,
      [id]
    );

    if (checkResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: `Medicine with id ${id} not found in ${category} category`,
      });
    }

    // Update category-specific table
    const updateMedicineSql = `
      UPDATE ${tableName} 
      SET quantity = quantity + ?, batch = ? 
      WHERE id = ?
    `;

    await connection.query(updateMedicineSql, [quantity, next_batch, id]);

    // Insert restock record
    const restockSql = `
      INSERT INTO RestockingRequests 
      (id, quantity, status, order_date, expected_delivery_date, category, next_batch) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [id, quantity, status, order_date, expected_delivery_date, category, next_batch];
    const [restockResult] = await connection.query(restockSql, values);

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Restocking request successful',
      restock_id: restockResult.insertId,
    });

  } catch (err) {
    await connection.rollback();
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// Get all restock orders
app.get('/api/restocks', async (req, res) => {
  const sql = `
    SELECT r.*, 
      COALESCE(m.name, cm.name, cnm.name, km.name, sm.name, am.name) as name
    FROM RestockingRequests r
    LEFT JOIN diabetes_medicines m ON r.id = m.id AND r.category = 'diabetes'
    LEFT JOIN cardiovascular_medicines cm ON r.id = cm.id AND r.category = 'cardiovascular'
    LEFT JOIN cancer_medicines cnm ON r.id = cnm.id AND r.category = 'cancer'
    LEFT JOIN kidney_disease_medicines km ON r.id = km.id AND r.category = 'kidney'
    LEFT JOIN stroke_medicines sm ON r.id = sm.id AND r.category = 'stroke'
    LEFT JOIN arthritis_medicines am ON r.id = am.id AND r.category = 'arthritis'
    ORDER BY order_date DESC`;

  try {
    const [results] = await pool.query(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get single restock order
app.get('/api/restocks/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM RestockingRequests WHERE id = ?';

  try {
    const [results] = await pool.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Restock order not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.patch('/api/restocks/:id', async (req, res) => {
  const { id } = req.params;
  const { status, isDelivered } = req.body;  // Remove completion_date from destructuring
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get the restock order details
    const [orderDetails] = await connection.query(
      'SELECT * FROM RestockingRequests WHERE id = ?',
      [id]
    );

    if (orderDetails.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Restock order not found' 
      });
    }

    const order = orderDetails[0];
    let tableName;
    
    switch (order.category) {
      case 'cardiovascular': tableName = 'cardiovascular_medicines'; break;
      case 'cancer': tableName = 'cancer_medicines'; break;
      case 'kidney': tableName = 'kidney_disease_medicines'; break;
      case 'stroke': tableName = 'stroke_medicines'; break;
      case 'arthritis': tableName = 'arthritis_medicines'; break;
      default: tableName = 'diabetes_medicines';
    }

    // If marking as delivered, update the medicine quantity and batch
    if (isDelivered) {
      const updateMedicineSql = `
        UPDATE ${tableName} 
        SET quantity = quantity + ?, batch = ?
        WHERE id = ?`;

      await connection.query(updateMedicineSql, [
        order.quantity,
        order.next_batch,
        order.id
      ]);
    }

    // Update the restock order - removed completion_date
    const updates = {};
    if (status) updates.status = status;
    if (isDelivered !== undefined) updates.isDelivered = isDelivered;

    const updateOrderSql = 'UPDATE RestockingRequests SET ? WHERE id = ?';
    await connection.query(updateOrderSql, [updates, id]);

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Restock order updated successfully' 
    });
  } catch (err) {
    await connection.rollback();
    console.error('Update Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  } finally {
    connection.release();
  }
});

// ------------------------------------------------------------------------------------
// --------------------------------
// PRESCRIPTION DETAILS
// --------------------------------
// Get all prescriptions for a specific patient
// Get prescriptions for a specific patient
app.get('/api/prescriptions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const connection = await pool.getConnection();
    const [prescriptions] = await connection.execute(`
      SELECT p.*,
      GROUP_CONCAT(
        JSON_OBJECT(
          'med_id', m.med_id,
          'name', m.name,
          'dosageForm', m.dosageForm,
          'dosageStrength', m.dosageStrength,
          'frequency', pm.frequency,
          'image', IFNULL(m.image, '')
        )
      ) as medications
      FROM prescriptions p
      LEFT JOIN presc_med pm ON p.presc_id = pm.presc_id
      LEFT JOIN medicines m ON pm.med_id = m.med_id
      WHERE p.patient_id = ?
      GROUP BY p.presc_id
      ORDER BY p.created_at DESC
    `, [patientId]);

    // Parse the medications string into JSON for each prescription
    const prescriptionsWithMedications = prescriptions.map(presc => ({
      ...presc,
      medications: JSON.parse('[' + presc.medications + ']')
    }));

    connection.release();
    res.json(prescriptionsWithMedications);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      message: 'Failed to fetch patient prescriptions',
      error: error.message
    });
  }
});


// Get a single prescription by ID
app.get('/api/prescriptions/:prescId', async (req, res) => {
  try {
    const { prescId } = req.params;
    const connection = await pool.getConnection();
    
    const [prescriptions] = await connection.execute(`
      SELECT 
        p.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'med_id', m.med_id,
            'presc_med_id', pm.presc_med_id,
            'name', m.name,
            'dosageForm', m.dosageForm,
            'dosageStrength', m.dosageStrength,
            'price', m.price,
            'frequency', pm.frequency,
            'medication_name', pm.medication_name,
            'image', m.image 
          )
        ) as medications
      FROM prescriptions p
      LEFT JOIN presc_med pm ON p.presc_id = pm.presc_id
      LEFT JOIN medicines m ON pm.med_id = m.med_id
      WHERE p.presc_id = ?
      GROUP BY p.presc_id
    `, [prescId]);

    if (prescriptions.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const prescription = {
      ...prescriptions[0],
      medications: JSON.parse('[' + prescriptions[0].medications + ']')
    };
    
    connection.release();
    res.json(prescription);
    
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
});

// Update the date for med rec and presc viewing
app.get('/api/prescriptions/patient/:patientId/date/:date', async (req, res) => {
  try {
    const { patientId, date } = req.params;
    const connection = await pool.getConnection();
    
    const formattedDate = moment(date).startOf('day').format('YYYY-MM-DD');
    
    const [prescriptions] = await connection.execute(`
      SELECT p.*, 
             GROUP_CONCAT(
               JSON_OBJECT(
                 'med_id', m.med_id,
                 'name', m.name,
                 'dosageForm', m.dosageForm,
                 'dosageStrength', m.dosageStrength,
                 'frequency', pm.frequency,
                 'image', m.image
               )
             ) as medications
      FROM prescriptions p
      LEFT JOIN presc_med pm ON p.presc_id = pm.presc_id
      LEFT JOIN medicines m ON pm.med_id = m.med_id
      WHERE p.patient_id = ?
      AND DATE(p.created_at) = ?
      GROUP BY p.presc_id
    `, [patientId, formattedDate]);

    if (!prescriptions.length) {
      connection.release();
      return res.status(404).json({ 
        message: `No prescription found for date ${formattedDate}`,
        details: {
          requestedDate: formattedDate,
          patientId
        }
      });
    }

    const prescription = {
      ...prescriptions[0],
      medications: JSON.parse('[' + prescriptions[0].medications + ']')
    };

    connection.release();
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
});

app.get('/api/providers/:providerId/prescriptions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { providerId } = req.params;
    
    // First verify the provider exists
    const [provider] = await connection.execute(
      'SELECT id, username FROM healthcare_providers WHERE id = ?',
      [providerId]
    );
    if (provider.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get all patients assigned to this provider
    const [patients] = await connection.execute(`
      SELECT DISTINCT p.*
      FROM patients p
      JOIN patient_provider_assignments ppa ON p.id = ppa.patient_id
      WHERE ppa.provider_id = ?
    `, [providerId]);

    // For each patient, check if they have prescriptions or medical records
    const patientsWithRecords = await Promise.all(
      patients.map(async (patient) => {
        // Get prescriptions
        const [prescriptions] = await connection.execute(`
          SELECT 
            p.presc_id,
            DATE_FORMAT(p.created_at, '%Y-%m-%d') as created_at,
            DATE_FORMAT(p.expiry_date, '%Y-%m-%d') as expiry_date
          FROM prescriptions p
          WHERE p.patient_id = ?
          ORDER BY p.created_at DESC
        `, [patient.id]);

        // Get medications for each prescription
        const prescriptionsWithMeds = await Promise.all(
          prescriptions.map(async (presc) => {
            const [medications] = await connection.execute(`
              SELECT 
                m.med_id,
                m.name,
                m.dosageForm,
                m.dosageStrength,
                m.image,
                pm.frequency,
                pm.medication_name AS prescribed_name
              FROM presc_med pm
              JOIN medicines m ON pm.med_id = m.med_id
              WHERE pm.presc_id = ?
            `, [presc.presc_id]);

            return {
              ...presc,
              medications
            };
          })
        );

        // Get medical records
        const [medicalRecords] = await connection.execute(`
          SELECT record_id
          FROM medical_records
          WHERE patient_id = ?
          LIMIT 1
        `, [patient.id]);

        // A patient is considered "existing" if they have either prescriptions or medical records
        const hasRecords = prescriptionsWithMeds.length > 0 || medicalRecords.length > 0;

        return {
          ...patient,
          prescriptions: prescriptionsWithMeds,
          hasRecords
        };
      })
    );

    // Group patients based on whether they have records
    const existingPatients = patientsWithRecords.filter(patient => patient.hasRecords);
    const newPatients = patientsWithRecords.filter(patient => !patient.hasRecords);

    res.json({
      provider: {
        id: providerId,
        username: provider[0].username
      },
      grouped: {
        existing: existingPatients,
        new: newPatients
      }
    });

  } catch (error) {
    console.error('Error fetching provider prescriptions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch provider prescriptions',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// Checks if a prescription has orders
app.get('/api/prescriptions/:prescId/has-orders', async (req, res) => {
  try {
    const [orderItems] = await pool.execute(`
      SELECT oi.order_id 
      FROM order_items oi 
      JOIN presc_med pm ON oi.presc_med_id = pm.presc_med_id 
      WHERE pm.presc_id = ?
      LIMIT 1
    `, [req.params.prescId]);

    res.json({
      hasOrders: orderItems.length > 0
    });
  } catch (error) {
    console.error('Error checking prescription orders:', error);
    res.status(500).json({ 
      message: 'Failed to check prescription orders',
      error: error.message 
    });
  }
});

// Editing Prescriptions
app.put('/api/prescriptions/:prescId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { prescId } = req.params;
    const { medications, expiry_date } = req.body;

    await connection.beginTransaction();

    // Update prescription expiry date
    await connection.execute(
      'UPDATE prescriptions SET expiry_date = ? WHERE presc_id = ?',
      [expiry_date, prescId]
    );

    // Update medications
    for (const medication of medications) {
      await connection.execute(`
        UPDATE presc_med 
        SET frequency = ?,
            medication_name = ?
        WHERE presc_id = ? AND med_id = ?
      `, [
        medication.frequency,
        medication.name,
        prescId,
        medication.med_id
      ]);

      // Update medicine details if changed
      await connection.execute(`
        UPDATE medicines 
        SET name = ?,
            dosageForm = ?,
            dosageStrength = ?
        WHERE med_id = ?
      `, [
        medication.name,
        medication.dosageForm,
        medication.dosageStrength,
        medication.med_id
      ]);
    }

    await connection.commit();
    
    res.json({ 
      message: 'Prescription updated successfully',
      prescId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating prescription:', error);
    res.status(500).json({ 
      message: 'Failed to update prescription',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// Deleting Prescriptions
app.delete('/api/prescriptions/:prescId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { prescId } = req.params;
    
    // Check if prescription has any orders
    const [orderItems] = await connection.execute(`
      SELECT oi.order_id 
      FROM order_items oi 
      JOIN presc_med pm ON oi.presc_med_id = pm.presc_med_id 
      WHERE pm.presc_id = ?
      LIMIT 1
    `, [prescId]);

    if (orderItems.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete prescription with existing orders',
        hasOrders: true
      });
    }

    await connection.beginTransaction();

    // Delete from presc_med first (foreign key relationship)
    await connection.execute(
      'DELETE FROM presc_med WHERE presc_id = ?',
      [prescId]
    );

    // Delete the prescription
    const [result] = await connection.execute(
      'DELETE FROM prescriptions WHERE presc_id = ?',
      [prescId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Prescription not found' });
    }

    await connection.commit();
    res.json({ message: 'Prescription deleted successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting prescription:', error);
    res.status(500).json({ 
      message: 'Failed to delete prescription',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// Add new prescription
// Prescription creation endpoint
app.post('/api/prescriptions', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { patient_id, presc_date, expiry_date, medications } = req.body;
    
    // First, create the prescription record
    const [prescResult] = await connection.execute(
      'INSERT INTO prescriptions (patient_id, created_at, expiry_date) VALUES (?, ?, ?)',
      [patient_id, presc_date, expiry_date]
    );
    
    const prescriptionId = prescResult.insertId;
    
    // Then, create records in presc_med table for each medication
    for (const med of medications) {
      await connection.execute(
        'INSERT INTO presc_med (patient_id, presc_id, med_id, medication_name, frequency, presc_date, quant_ordered) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          patient_id,
          prescriptionId,
          med.med_id,
          med.name,
          med.frequency,
          presc_date,
          1  // Default to 1 for now
        ]
      );
    }
    
    await connection.commit();
    res.json({
      success: true,
      prescriptionId,
      message: 'Prescription created successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating prescription:', error);
    res.status(500).json({ 
      error: 'Failed to create prescription',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Get available medicines
// Get available medicines - Modified to return only unique medications
app.get('/api/medicines', async (req, res) => {
  try {
    // First, get a list of unique medications
    const [medicines] = await pool.execute(`
      SELECT 
        MIN(med_id) as med_id,
        name,
        category,
        dosageForm,
        dosageStrength,
        MIN(price) as price,
        MIN(batch) as oldest_batch,
        MIN(image) as image,
        SUM(quantity) as total_quantity
      FROM medicines 
      GROUP BY name, category, dosageForm, dosageStrength
      HAVING SUM(quantity) > 0
      ORDER BY name
    `);
    
    // For each medicine, get its batches
    const medicinesWithBatches = await Promise.all(
      medicines.map(async (med) => {
        const [batches] = await pool.execute(`
          SELECT 
            batch,
            quantity
          FROM medicines
          WHERE name = ? 
            AND quantity > 0
          ORDER BY batch ASC
        `, [med.name]);

        return {
          ...med,
          batches: batches.map(b => ({
            batch: b.batch,
            quantity: b.quantity
          }))
        };
      })
    );

    res.json(medicinesWithBatches);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ 
      message: 'Failed to fetch medicines',
      error: error.message 
    });
  }
});

// --------------------------------
// MEDICAL RECORDS
// --------------------------------
// Get single medical record for a patient on specific date
app.get('/api/medical-records/patient/:patientId/date/:date', async (req, res) => {
  try {
    const { patientId, date } = req.params;
    console.log('Attempted fetch for:');
    console.log('Patient ID:', patientId);
    console.log('Raw date:', date);
    
    // Parse the date using moment
    const parsedDate = moment(date).format('YYYY-MM-DD');
    console.log('Parsed date:', parsedDate);

    const [records] = await pool.execute(
      `
      SELECT 
        mr.*,
        DATE_FORMAT(mr.record_date, '%Y-%m-%d') as record_date
      FROM medical_records mr
      WHERE mr.patient_id = ?
      AND DATE(mr.record_date) = DATE(?)
      `,
      [patientId, parsedDate]
    );
    
    console.log('Query returned:', records);

    if (records.length === 0) {
      console.log('No records found for these parameters');
      return res.status(404).json({ message: `No medical record found for patient ${patientId} on date ${parsedDate}` });
    }
    res.json(records[0]);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all medical records for patient where it returns array of records sorted by date descending 
app.get('/api/medical-records/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const [records] = await pool.execute(`
      SELECT 
        mr.*,
        DATE_FORMAT(mr.record_date, '%Y-%m-%d') as record_date,
        DATE_FORMAT(mr.next_checkup_date, '%Y-%m-%d') as next_checkup_date
      FROM medical_records mr
      WHERE mr.patient_id = ?
      ORDER BY mr.record_date DESC
    `, [patientId]);

    // If no records found, return empty array instead of 404
    res.json(records || []);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Creating new medical records
app.post('/api/medical-records', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      patient_id,
      record_date,
      height,
      weight,
      bmi,
      blood_pressure,
      heart_rate,
      cholesterol,
      hdl,
      ldl,
      triglyceride,
      next_checkup_date
    } = req.body;

    await connection.beginTransaction();

    // Verify patient exists
    const [patientExists] = await connection.execute(
      'SELECT id FROM patients WHERE id = ?',
      [patient_id]
    );

    if (patientExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get provider_id
    const [providerAssignment] = await connection.execute(
      'SELECT provider_id FROM patient_provider_assignments WHERE patient_id = ?',
      [patient_id]
    );

    if (providerAssignment.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No healthcare provider assigned to this patient' });
    }

    const provider_id = providerAssignment[0].provider_id;

    // Insert medical record
    const [result] = await connection.execute(
      `INSERT INTO medical_records (
        patient_id,
        provider_id,
        record_date,
        height,
        weight,
        bmi,
        blood_pressure,
        heart_rate,
        cholesterol,
        triglyceride,
        hdl,
        ldl,
        next_checkup_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        provider_id,
        record_date,
        height,
        weight,
        bmi,
        blood_pressure,
        heart_rate,
        cholesterol,
        triglyceride,
        hdl,
        ldl,
        next_checkup_date
      ]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Medical record created successfully',
      record_id: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating medical record:', error);
    res.status(500).json({ 
      message: 'Failed to create medical record',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// Update medical record
app.put('/api/medical-records/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      height,
      weight,
      bmi,
      blood_pressure,
      heart_rate,
      cholesterol,
      hdl,
      ldl,
      triglyceride,
      next_checkup_date
    } = req.body;

    // Validate and convert numeric fields
    const sanitizedData = {
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      blood_pressure: blood_pressure || null,
      heart_rate: heart_rate ? parseInt(heart_rate) : null,
      cholesterol: cholesterol ? parseFloat(cholesterol) : null,
      hdl: hdl ? parseFloat(hdl) : null,
      ldl: ldl ? parseFloat(ldl) : null,
      triglyceride: triglyceride ? parseFloat(triglyceride) : null,
      next_checkup_date: next_checkup_date ? moment(next_checkup_date).format('YYYY-MM-DD') : null
    };

    // Build dynamic update query including only non-null fields
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(sanitizedData).forEach(([key, value]) => {
      if (value !== null) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    // Add recordId to values array
    updateValues.push(recordId);

    // Only proceed if there are fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const query = `
      UPDATE medical_records 
      SET ${updateFields.join(', ')}
      WHERE record_id = ?
    `;

    console.log('Query:', query);
    console.log('Values:', updateValues);

    const [result] = await pool.execute(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    res.json({ 
      message: 'Medical record updated successfully',
      updatedFields: Object.keys(sanitizedData).filter(key => sanitizedData[key] !== null)
    });

  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({ 
      message: 'Failed to update medical record',
      error: error.message,
      details: error.sqlMessage || error.message
    });
  }
});

// Deleting medical records
app.delete('/api/medical-records/:recordId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { recordId } = req.params;

    await connection.beginTransaction();

    // Delete the medical record
    const [result] = await connection.execute(
      'DELETE FROM medical_records WHERE record_id = ?',
      [recordId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Medical record not found' });
    }

    await connection.commit();
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting medical record:', error);
    res.status(500).json({ 
      message: 'Failed to delete medical record',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// ------------------------------------------
// PATIENT to PROVIDER ASSIGNMENT
// ------------------------------------------
// Get provider's assigned patients
app.get('/api/providers/:id/patients', async (req, res) => {
  try {
    // First verify the provider exists
    const [providerResults] = await pool.execute(
      'SELECT id, username FROM healthcare_providers WHERE id = ?',
      [req.params.id]
    );

    if (providerResults.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const [patients] = await pool.execute(`
      SELECT 
        pgv.patient_id as id,
        pgv.full_name,
        pgv.ic_number,
        pgv.assignment_date,
        pgv.patient_type,
        CASE 
            WHEN pgv.patient_type COLLATE utf8mb4_unicode_ci = 'new' THEN 1
            ELSE 2
        END as sort_order
      FROM patient_groups_view pgv
      WHERE pgv.provider_id = ?
      ORDER BY 
        sort_order,
        pgv.assignment_date DESC,
        pgv.full_name COLLATE utf8mb4_unicode_ci ASC
    `, [req.params.id]);

    // Group patients based on medical records existence
    const groupedPatients = {
      new: patients.filter(p => p.patient_type === 'new'),
      existing: patients.filter(p => p.patient_type === 'existing')
    };

    // Send response with provider info and grouped patients
    res.json({
      provider: {
        id: providerResults[0].id,
        username: providerResults[0].username
      },
      grouped: groupedPatients,
      total: patients.length
    });

  } catch (error) {
    console.error('Error fetching provider\'s patients:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});


// --------------------------------
// ORDER MODULE
// --------------------------------
// Cart Management
app.post('/api/cart', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { presc_med_id, provider_id, patient_id, quantity } = req.body;
    
    console.log('Received cart request:', {
      presc_med_id,
      provider_id,
      patient_id,
      quantity
    });

    // Input validation
    if (!presc_med_id || !provider_id || !patient_id || !quantity) {
      return res.status(400).json({
        message: 'Missing required fields',
        received: { presc_med_id, provider_id, patient_id, quantity }
      });
    }

    await connection.beginTransaction();

    // First verify prescription medicine exists
    const [prescMed] = await connection.execute(
      'SELECT * FROM presc_med WHERE presc_med_id = ?',
      [presc_med_id]
    );

    if (prescMed.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Prescription medicine not found',
        presc_med_id
      });
    }

    // Check if item already exists in cart
    const [existingItem] = await connection.execute(
      'SELECT * FROM cart_items WHERE presc_med_id = ? AND provider_id = ? AND patient_id = ?',
      [presc_med_id, provider_id, patient_id]
    );

    if (existingItem.length > 0) {
      // Update quantity if item exists
      await connection.execute(
        'UPDATE cart_items SET quantity = ? WHERE presc_med_id = ? AND provider_id = ? AND patient_id = ?',
        [quantity, presc_med_id, provider_id, patient_id]
      );
    } else {
      // Add new item if it doesn't exist
      await connection.execute(
        'INSERT INTO cart_items (presc_med_id, provider_id, patient_id, quantity) VALUES (?, ?, ?, ?)',
        [presc_med_id, provider_id, patient_id, quantity]
      );
    }

    await connection.commit();
    
    res.status(201).json({
      message: 'Added to cart successfully',
      item: {
        presc_med_id,
        provider_id,
        patient_id,
        quantity
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Cart Error:', error);
    res.status(500).json({
      message: 'Failed to add item to cart',
      error: error.message,
      details: {
        presc_med_id: req.body.presc_med_id,
        provider_id: req.body.provider_id,
        patient_id: req.body.patient_id,
        quantity: req.body.quantity
      }
    });
  } finally {
    connection.release();
  }
});

app.get('/api/cart/:providerId/:patientId', async (req, res) => {
  try {
    const { providerId, patientId } = req.params;

    const [cartItems] = await pool.execute(`
      SELECT 
        ci.*,
        m.name,
        m.price,
        m.dosageForm,
        m.dosageStrength,
        m.med_id,
        m.image,    
        pm.frequency
      FROM cart_items ci
      JOIN presc_med pm ON ci.presc_med_id = pm.presc_med_id
      JOIN medicines m ON pm.med_id = m.med_id
      WHERE ci.provider_id = ? AND ci.patient_id = ?
    `, [providerId, patientId]);

    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Order Management
// Also implemented a FIFO (First In, First Out) system for medicine batches, where older batches are used up before newer ones
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { patient_id, provider_id, cart_items, total_amount, delivery_method } = req.body;

    // Create order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (patient_id, provider_id, total_amount, delivery_method) VALUES (?, ?, ?, ?)',
      [parseInt(patient_id), parseInt(provider_id), parseFloat(total_amount), delivery_method]
    );

    const orderId = orderResult.insertId;

    // Process each cart item
    for (const item of cart_items) {
      // Insert order item
      await connection.execute(
        'INSERT INTO order_items (order_id, med_id, presc_med_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [orderId, parseInt(item.med_id), parseInt(item.presc_med_id), parseInt(item.quantity), parseFloat(item.price)]
      );

      // Get all available batches for this medicine, ordered by batch number (FIFO)
      const [batches] = await connection.execute(
        'SELECT med_id, category, name, quantity, batch FROM medicines WHERE name = (SELECT name FROM medicines WHERE med_id = ?) AND quantity > 0 ORDER BY batch ASC',
        [parseInt(item.med_id)]
      );

      let remainingQuantity = parseInt(item.quantity);
      
      // Process each batch until order quantity is fulfilled
      for (const batch of batches) {
        if (remainingQuantity <= 0) break;

        const quantityFromBatch = Math.min(batch.quantity, remainingQuantity);
        const newBatchQuantity = batch.quantity - quantityFromBatch;
        remainingQuantity -= quantityFromBatch;

        if (quantityFromBatch > 0) {
          // Update medicines table for this specific batch
          await connection.execute(
            'UPDATE medicines SET quantity = ? WHERE med_id = ? AND batch = ?',
            [newBatchQuantity, batch.med_id, batch.batch]
          );

          // Update category-specific table for this specific batch
          const categoryTable = getMedicineTableName(batch.category);
          await connection.execute(
            `UPDATE ${categoryTable} SET quantity = ? WHERE name = ? AND batch = ?`,
            [newBatchQuantity, batch.name, batch.batch]
          );
        }
      }

      if (remainingQuantity > 0) {
        throw new Error(`Insufficient stock for medicine ${batches[0].name}`);
      }
    }

    // Handle delivery information if provided
    if (delivery_method === 'delivery' && delivery_info) {
      await connection.execute(
        `INSERT INTO delivery_info 
         (order_id, address, contact_name, contact_phone, delivery_notes) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          delivery_info.address,
          delivery_info.contact_name,
          delivery_info.contact_phone,
          delivery_info.delivery_notes || null
        ]
      );

      // Create delivery-specific notification
      await connection.execute(
        `INSERT INTO patient_notifications 
         (patient_id, title, message, type) 
         VALUES (?, ?, ?, ?)`,
        [
          patient_id,
          'Delivery Information Received',
          `Your order #${orderId} will be delivered to ${delivery_info.contact_name}`,
          'delivery_status'
        ]
      );
    }

    // Create general order notification
    await connection.execute(
      `INSERT INTO patient_notifications
      (patient_id, title, message, type)
      VALUES (?, ?, ?, ?)`,
      [
        patient_id,
        'New Order Placed',
        `A new order #${orderId} has been placed.`,
        'order_placed'
      ]
    );


    // Clear cart items
    await connection.execute(
      'DELETE FROM cart_items WHERE patient_id = ? AND provider_id = ?',
      [patient_id, provider_id]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create order',
      details: error
    });
  } finally {
    connection.release();
  }
});

// Get orders for a patient
app.get('/api/orders/patient/:patientId', async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        di.address,
        di.contact_name,
        di.contact_phone,
        di.delivery_notes,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'med_id', oi.med_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'name', m.name,
            'dosageForm', m.dosageForm,
            'dosageStrength', m.dosageStrength,
            'image', m.image
          )
        ) as items
      FROM orders o
      LEFT JOIN delivery_info di ON o.order_id = di.order_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN medicines m ON oi.med_id = m.med_id
      WHERE o.patient_id = ?
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `, [req.params.patientId]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
// In your server.js
// Update order status
// In your server endpoint where you handle the delivery info
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { orderId } = req.params;
    const { status, delivery_method, delivery_info, patient_id } = req.body;

    // Only update the status if delivery_method is not provided
    if (!delivery_method) {
      await connection.execute(
        'UPDATE orders SET order_status = ? WHERE order_id = ?',
        [status, orderId]
      );
    } else {
      await connection.execute(
        'UPDATE orders SET order_status = ?, delivery_method = ? WHERE order_id = ?',
        [status, delivery_method, orderId]
      );
    }

    // Create notification for completed order
    if (status === 'completed' && patient_id) {
      await connection.execute(
        `INSERT INTO patient_notifications 
         (patient_id, title, message, type) 
         VALUES (?, ?, ?, ?)`,
        [
          patient_id,
          'Order Completed',
          `Your order #${orderId} has been marked as completed.`,
          'order_status'
        ]
      );
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Order status updated successfully',
      orderId,
      status
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get patient notifications
// In your server code
app.get('/api/notifications/patient/:patientId', async (req, res) => {
  try {
    
    const [notifications] = await pool.execute(
      'SELECT * FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC',
      [req.params.patientId]
    );
    
    console.log('Found notifications:', notifications);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE patient_notifications SET is_read = TRUE WHERE notification_id = ?',
      [req.params.notificationId]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --------------------------------
// PROVIDERS INFO FOR PROFILE
// --------------------------------
// Get provider profile information
app.get('/api/providers/:id', async (req, res) => {
  try {
    // First check if this ID belongs to a provider with more specific query
    const [providers] = await pool.execute(
      'SELECT id, username, employee_id, full_name, phone_number FROM healthcare_providers WHERE id = ? AND employee_id IS NOT NULL',
      [req.params.id]
    );

    // If no provider found with this ID
    if (providers.length === 0) {
      console.log('No provider found for ID:', req.params.id);
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log('Provider data fetched:', providers[0]);
    res.json(providers[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update provider profile information
app.put('/api/providers/:id/info', async (req, res) => {
  try {
    const { full_name, username, phone_number } = req.body;
    const providerId = req.params.id;

    // First verify this provider exists
    const [existingProvider] = await pool.execute(
      'SELECT id FROM healthcare_providers WHERE id = ?',
      [providerId]
    );

    if (existingProvider.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Update provider information
    await pool.execute(
      'UPDATE healthcare_providers SET full_name = ?, username = ?, phone_number = ? WHERE id = ?',
      [full_name, username, phone_number, providerId]
    );

    res.json({ message: 'Provider information updated successfully' });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// --------------------------------
//        NEVER CHANGE THIS
// --------------------------------

// --------------------------------
// SERVER SETUP
// --------------------------------
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack 
  });
});

// Start Server
const startServer = async () => {
  try {
    await createConnectionPool();
    app.listen(config.server.port, config.server.listenAddress, () => {
      console.log(`Server running on http://${config.server.host}:${config.server.port}`);
      console.log('Listening on all network interfaces');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

startServer();

module.exports = app;