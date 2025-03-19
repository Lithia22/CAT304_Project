CREATE DATABASE REPILL;
USE REPILL;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;


-- PATIENT TABLE --
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ic_number VARCHAR(12) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    delivery_add TEXT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry DATETIME NULL
);

-- PROVIDER TABLE --
CREATE TABLE healthcare_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    profession VARCHAR(255) NOT NULL,
    patients_count INT DEFAULT 0
);

-- PRESCRIPTION TABLE --
CREATE TABLE prescriptions (
    presc_id INT AUTO_INCREMENT PRIMARY KEY, -- Auto-incrementing base ID
    patient_id INT NOT NULL,
    created_at DATE NOT NULL, -- Date when the prescription is created
    expiry_date DATE, -- Date when the prescription expires
    FOREIGN KEY (patient_id) REFERENCES patients(id) -- Foreign key constraint
);

-- MEDICINES TABLE --
CREATE TABLE medicines (
    med_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT,
	reorderPoint INT,
	dosageForm VARCHAR(255),
	dosageStrength VARCHAR(255),
	price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	expirationDate DATE,
    image VARCHAR(255)
);

DROP TABLE presc_med;
-- PRESC_MED TABLE --
CREATE TABLE presc_med (
    presc_med_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    presc_id INT NOT NULL,
    med_id INT NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    presc_date DATE,
    quant_ordered INT NOT NULL DEFAULT 1,
    FOREIGN KEY (presc_id) REFERENCES prescriptions(presc_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (med_id) REFERENCES medicines(med_id)
);

-- MEDICAL_RECORDS TABLE --
CREATE TABLE medical_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    record_date DATE NOT NULL,
    height DECIMAL(3,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(4,2),
    blood_pressure VARCHAR(20),
    heart_rate INT,
    cholesterol DECIMAL(4,2),
    triglyceride DECIMAL(4,2),
    hdl DECIMAL(4,2),
    ldl DECIMAL(4,2),
    next_checkup_date DATE,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
);

-- PATIENT_PROVIDER_ASSIGNMENTS TABLE --
CREATE TABLE patient_provider_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
);

-- TEMP DATA FOR PRESC_MED TABLE --
INSERT INTO presc_med (patient_id, presc_id, med_id, medication_name, frequency, presc_date, quant_ordered) VALUES
(19, 101, 1, 'Metformin',  'Twice daily', '2024-10-15',1),
(19, 101, 2, 'Lisinopril', 'Once daily', '2024-10-15',1),
(19, 102, 3, 'Atorvastatin', 'Once daily', '2024-07-02',1);

-- TEMP DATA FOR MEDICINES --
INSERT INTO medicines (med_id, name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image)
VALUES
    (1, 'Metformin', 100, 50, 'tablet', '500mg', 25.99, '2025-12-31', '/assets/medications/metformin.jpg'),
    (2, 'Lisinopril', 200, 30, 'tablet', '10mg', 15.50, '2025-12-31', '/assets/medications/lisinopril.jpg'),
    (3, 'Atorvastatin', 150, 40, 'tablet', '20mg', 45.75, '2025-12-31', '/assets/medications/atorvastatin.jpg');

-- TEMP DATA FOR MEDICAL_RECORDS --
INSERT INTO medical_records (
    patient_id, provider_id, presc_med_id, record_date, 
    bmi, weight, height, blood_pressure, heart_rate,
    cholesterol, triglyceride, hdl, ldl, next_checkup_date
) VALUES (
    19, 7, 1, '2024-10-15',
    22.27, 50.00, 1.60, '120/80', 80,
    5.0, 1.5, 1.4, 3.1, DATE_ADD('2024-10-15', INTERVAL 90 DAY)
);

-- TEMP DATA FOR PATIENT_PROVIDER_ASSIGNEMNT --
INSERT INTO patient_provider_assignments (patient_id, provider_id) 
VALUES (19, 7);

-- KAVITA MODULE --
CREATE TABLE diabetes_medicines (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT NULL,
  reorderPoint INT DEFAULT NULL,
  dosageForm VARCHAR(255) DEFAULT NULL,
  dosageStrength VARCHAR(255) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT NULL,
  expirationDate DATE DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  batch VARCHAR(50) DEFAULT NULL
);

INSERT INTO diabetes_medicines (id, name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
(28, 'Metformin', 200, 50, 'Tablet', '500mg', 10, '2025-02-26', '/assets/medications/Metformin.jpg', 'MET-001'),
(29, 'Glipizide', 55, 25, 'Tablet', '5mg', 5, '2025-04-21', '/assets/medications/Glipizide.jpg', 'GLP-001'),
(30, 'Glyburide', 180, 40, 'Tablet', '5mg', 20, '2024-12-24', '/assets/medications/Glyburide.jpg', 'GLYB-001'),
(31, 'Pioglitazone', 140, 50, 'Tablet', '30mg', 8, '2025-05-19', '/assets/medications/Pioglitazone.jpg', 'PIO-001'),
(32, 'Sitaglipin', 60, 20, 'Tablet', '100mg', 40, '2025-03-07', '/assets/medications/Sitaglipin.jpg', 'SITA-002'),
(33, 'Linagliptin', 95, 30, 'Tablet', '5mg', 50, '2025-08-11', '/assets/medications/Linagliptin.jpg', 'LINA-001'),
(34, 'Insulin Glargine', 80, 60, 'Injectable Pen', '100 units/mL', 200, '2025-12-09', '/assets/medications/Insulin_Glargine.jpg', 'GLAR-001'),
(35, 'Insulin Lispro', 120, 50, 'Injectable Pen', '100 units/mL', 180, '2025-10-04', '/assets/medications/Insulin_Lispro.jpg', 'LISP-001'),
(36, 'Empagliflozin', 21, 45, 'Tablet', '25mg', 25, '2025-03-25', '/assets/medications/Empagliflozin.jpg', 'EMPA-001'),
(37, 'Dapagliflozin', 180, 10, 'Tablet', '10mg', 35, '2025-05-13', '/assets/medications/Dapagliflozin.jpg', 'DAPA-001');

SELECT * FROM diabetes_medicines;
DESCRIBE diabetes_medicines;

CREATE TABLE cardiovascular_medicines (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT,
    reorderPoint INT,
    dosageForm VARCHAR(255),
    dosageStrength VARCHAR(255),
    price DECIMAL(10, 2),
    expirationDate DATE,
    image VARCHAR(255),
    batch VARCHAR(50)
);

INSERT INTO cardiovascular_medicines (id, name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
(5, 'Atorvastatin', 50, 20, 'Tablet', '20mg', 12.00, '2025-05-15', '/assets/medications/Atorvastatin.jpg', 'ATOR-001'),
(6, 'Carvedilol', 20, 15, 'Tablet', '12.5mg', 10.00, '2025-01-05', '/assets/medications/Carvedilol.jpg', 'CARV-001'),
(7, 'Amlodipine', 25, 10, 'Tablet', '10mg', 25.00, '2025-10-16', '/assets/medications/Amlodipine.jpg', 'AMLO-001'),
(8, 'Bisoprolol', 40, 20, 'Tablet', '5mg', 32.00, '2025-02-06', '/assets/medications/Bisoprolol.jpg', 'BISO-001'),
(9, 'Metoprolol', 15, 30, 'Tablet', '50mg', 15.00, '2025-07-10', '/assets/medications/Metoprolol.jpg', 'METO-001'),
(10, 'Lisinopril', 60, 20, 'Tablet', '20mg', 17.00, '2025-06-25', '/assets/medications/Lisinopril.jpg', 'LIS-001'),
(11, 'Losartan', 58, 10, 'Tablet', '50mg', 10.00, '2025-12-16', '/assets/medications/Losartan.jpg', 'LOSA-002'),
(12, 'Clopidogrel', 65, 30, 'Tablet', '75mg', 30.00, '2025-01-07', '/assets/medications/Clopidogrel.jpg', 'CLOP-001');

SELECT * FROM cardiovascular_medicines;
DESCRIBE cardiovascular_medicines;


CREATE TABLE cancer_medicines (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT NULL,
    reorderPoint INT DEFAULT NULL,
    dosageForm VARCHAR(255) DEFAULT NULL,
    dosageStrength VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    expirationDate DATE DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    batch VARCHAR(50) DEFAULT NULL
);

INSERT INTO cancer_medicines (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
('Paclitaxel', 82, 25, 'Injection', '6mg/mL', 15, '2025-12-15', '/assets/medications/Paclitaxel.jpg', 'PAC-002'),
('Trastuzumab', 60, 10, 'Injection', '440mg', 120, '2025-08-12', '/assets/medications/Trastuzumab.jpg', 'TRA-001'),
('Doxorubicin', 105, 20, 'Injection', '2mg/mL', 90, '2026-02-12', '/assets/medications/Doxorubicin.jpg', 'DOX-001'),
('Imatinib', 90, 10, 'Tablet', '100mg', 500, '2025-02-01', '/assets/medications/Imatinib.jpg', 'IMA-001'),
('Cisplatin', 30, 50, 'Injection', '50mL', 75, '2025-10-08', '/assets/medications/Cisplatin.jpg', 'CIS-001'),
('Vincristine', 55, 20, 'Injection', '1mg/1mL', 60, '2025-08-13', '/assets/medications/Vincristine.jpg', 'VIN-001'),
('Erlotinib', 75, 10, 'Tablet', '150mg', 300, '2025-05-15', '/assets/medications/Erlotinib.jpg', 'ERL-001'),
('Gemcitabine', 45, 15, 'Injection', '1.4gm', 45, '2025-10-15', '/assets/medications/Gemcitabine.jpg', 'GEM-001');

SELECT * FROM cancer_medicines;
DESCRIBE cancer_medicines;

CREATE TABLE kidney_disease_medicines (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT NULL,
    reorderPoint INT DEFAULT NULL,
    dosageForm VARCHAR(255) DEFAULT NULL,
    dosageStrength VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    expirationDate DATE DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    batch VARCHAR(50) DEFAULT NULL
);

INSERT INTO kidney_disease_medicines (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
('Aliskiren', 100, 20, 'Tablet', '150mg', 50, '2025-05-14', '/assets/medications/Aliskiren.jpg', 'ALI-001'),
('Spironolactone', 15, 30, 'Tablet', '50mg', 20, '2025-09-02', '/assets/medications/Spironolactone.jpg', 'SPI-001'),
('Furosemide', 60, 10, 'Tablet', '20mg', 50, '2025-09-09', '/assets/medications/Furosemide.jpg', 'FURO-001'),
('Hydrochloro', 105, 30, 'Tablet', '25mg', 60, '2026-05-10', '/assets/medications/Hydrochloro.jpg', 'HYD-001'),
('Enalapril', 15, 20, 'Tablet', '10mg', 75, '2026-03-06', '/assets/medications/Enalapril.jpg', 'ENAL-001'),
('Carvedilol', 68, 15, 'Tablet', '12.5mg', 30, '2026-02-04', '/assets/medications/Carvedilol.jpg', 'CARV-001'),
('Quinapril', 90, 20, 'Tablet', '20mg', 50, '2025-01-30', '/assets/medications/Quinapril.jpg', 'QUIN-001'),
('Atenolol', 50, 10, 'Tablet', '50mg', 45, '2025-11-12', '/assets/medications/Atenolol.jpg', 'ATEN-001');

SELECT * FROM kidney_disease_medicines;
DESCRIBE kidney_disease_medicines;

CREATE TABLE stroke_medicines (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT NULL,
    reorderPoint INT DEFAULT NULL,
    dosageForm VARCHAR(255) DEFAULT NULL,
    dosageStrength VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    expirationDate DATE DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    batch VARCHAR(50) DEFAULT NULL
);

INSERT INTO stroke_medicines (name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
('Clopidogrel', 12, 25, 'Tablet', '75mg', 10.00, '2025-12-17', '/assets/medications/Clopidogrel.jpg', 'CLO-001'),
('Warfarin', 85, 10, 'Tablet', '5mg', 15.00, '2026-02-11', '/assets/medications/Warfarin.jpg', 'WAR-001'),
('Atorvastatin', 65, 25, 'Tablet', '10mg', 5.00, '2026-04-16', '/assets/medications/Atorvastatin.jpg', 'ATR-001'),
('Rosuvastatin', 65, 20, 'Tablet', '10mg', 30.00, '2025-08-05', '/assets/medications/Rosuvastatin.jpg', 'ROS-002'),
('Simvastatin', 110, 15, 'Tablet', '40mg', 40.00, '2025-10-10', '/assets/medications/Simvastatin.jpg', 'SIM-001'),
('Edoxaban', 72, 10, 'Tablet', '30mg', 15.00, '2025-01-31', '/assets/medications/Edoxaban.jpg', 'EDO-001'),
('Dabigatran', 95, 30, 'Capsule', '110mg', 70.00, '2026-06-24', '/assets/medications/Dabigatran.jpg', 'DAB-001'),
('Apixaban', 30, 20, 'Tablet', '5mg', 45.00, '2025-07-17', '/assets/medications/Apixaban.jpg', 'APIX-001');

SELECT * FROM stroke_medicines;
DESCRIBE stroke_medicines;

CREATE TABLE arthritis_medicines (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    quantity INT,
    reorderPoint INT,
    dosageForm VARCHAR(255),
    dosageStrength VARCHAR(255),
    price DECIMAL(10, 2),
    expirationDate DATE,
    image VARCHAR(255),
    batch VARCHAR(50)
);

INSERT INTO arthritis_medicines (id, name, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
VALUES
(3, 'Methotrexate', 40, 10, 'Tablet', '10mg', 25, '2025-06-11', '/assets/medications/Methotrexate.jpg', 'METH-001'),
(4, 'Sulfasalazine', 62, 15, 'Tablet', '500mg', 12, '2025-09-26', '/assets/medications/Sulfasalazine.jpg', 'SULF-001'), 
(5, 'Leflunomide', 4, 10, 'Tablet', '10mg', 52, '2025-08-15', '/assets/medications/Leflunomide.jpg', 'LEF-001'), 
(6, 'Etanercept', 81, 15, 'Injection', '25mg/0.5mL', 45, '2025-09-19', '/assets/medications/Etanercept.jpg', 'ETAN-002'), 
(7, 'Adalimumab', 30, 15, 'Injection', '40mg/0.8mL', 75, '2025-08-09', '/assets/medications/Adalimumab.jpg', 'ADAL-001'),
(8, 'Celecoxib', 63, 25, 'Capsule', '200mg', 36, '2025-01-27', '/assets/medications/Celecoxib.jpg', 'CEL-001'),
(9, 'Diclofenac', 24, 10, 'Tablet', '25mg', 14, '2025-08-09', '/assets/medications/Diclofenac.jpg', 'DIC-001'),
(10, 'Naproxen', 12, 10, 'Tablet', '500mg', 12, '2025-05-15', '/assets/medications/Naproxen.jpg', 'NAP-001');

SELECT * FROM arthritis_medicines;
DESCRIBE arthritis_medicines;

CREATE TABLE restockingrequests (
    restock_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    next_batch VARCHAR(255) NOT NULL,
    isDelivered TINYINT DEFAULT 0,
    category VARCHAR(255) NOT NULL,
    CONSTRAINT chk_category CHECK (
        category IN ('diabetes', 'cardiovascular', 'cancer', 'kidney', 'stroke', 'arthritis')
    )
);

UPDATE restockingrequests
SET category = 'diabetes'
WHERE id IN (SELECT id FROM diabetes_medicines);

UPDATE restockingrequests
SET category = 'cardiovascular'
WHERE id IN (SELECT id FROM cardiovascular_medicines);

UPDATE restockingrequests
SET category = 'cancer'
WHERE id IN (SELECT id FROM cancer_medicines);

UPDATE restockingrequests
SET category = 'kidney'
WHERE id IN (SELECT id FROM kidney_disease_medicines);

UPDATE restockingrequests
SET category = 'stroke'
WHERE id IN (SELECT id FROM stroke_medicines);

UPDATE restockingrequests
SET category = 'arthritis'
WHERE id IN (SELECT id FROM arthritis_medicines);

-- ---------------- --
--   OTHER QUERIES  --
-- ---------------- --
-- Trigger to increment counter after new patient assignment
DELIMITER //
CREATE TRIGGER after_patient_assignment
AFTER INSERT ON patient_provider_assignments
FOR EACH ROW
BEGIN
    UPDATE healthcare_providers
    SET patients_count = patients_count + 1
    WHERE id = NEW.provider_id;
END;//

-- Trigger to decrement counter after patient unassignment
CREATE TRIGGER after_patient_unassignment
AFTER DELETE ON patient_provider_assignments
FOR EACH ROW
BEGIN
    UPDATE healthcare_providers
    SET patients_count = patients_count - 1
    WHERE id = OLD.provider_id;
END;//
DELIMITER ;

-- Fix any existing inconsistencies
UPDATE healthcare_providers hp
SET patients_count = (
    SELECT COUNT(*)
    FROM patient_provider_assignments ppa
    WHERE ppa.provider_id = hp.id
);

-- Create new view with explicit collation
CREATE OR REPLACE VIEW patient_groups_view AS
SELECT 
    p.id AS patient_id,
    p.full_name COLLATE utf8mb4_unicode_ci AS full_name,
    p.ic_number COLLATE utf8mb4_unicode_ci AS ic_number,
    ppa.provider_id,
    ppa.assignment_date,
    CASE
        WHEN EXISTS (
            SELECT 1 
            FROM medical_records mr 
            WHERE mr.patient_id = p.id
        ) THEN 'existing' COLLATE utf8mb4_unicode_ci
        ELSE 'new' COLLATE utf8mb4_unicode_ci
    END AS patient_type
FROM patients p
JOIN patient_provider_assignments ppa ON p.id = ppa.patient_id;


-- Add category column to medicines table
ALTER TABLE medicines
ADD COLUMN category ENUM('diabetes', 'cardiovascular', 'cancer', 'kidney', 'stroke', 'arthritis') AFTER name,
ADD COLUMN batch VARCHAR(50) AFTER image;

-- Create indexes for better performance
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_name ON medicines(name);

-- Create triggers for diabetes medicines
DELIMITER //

CREATE TRIGGER after_diabetes_medicine_insert
AFTER INSERT ON diabetes_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'diabetes', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_diabetes_medicine_update
AFTER UPDATE ON diabetes_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'diabetes';
END//

CREATE TRIGGER after_diabetes_medicine_delete
AFTER DELETE ON diabetes_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'diabetes';
END//

-- Create triggers for cardiovascular medicines
CREATE TRIGGER after_cardiovascular_medicine_insert
AFTER INSERT ON cardiovascular_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'cardiovascular', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_cardiovascular_medicine_update
AFTER UPDATE ON cardiovascular_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'cardiovascular';
END//

CREATE TRIGGER after_cardiovascular_medicine_delete
AFTER DELETE ON cardiovascular_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'cardiovascular';
END//

-- Create triggers for cancer medicines
CREATE TRIGGER after_cancer_medicine_insert
AFTER INSERT ON cancer_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'cancer', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_cancer_medicine_update
AFTER UPDATE ON cancer_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'cancer';
END//

CREATE TRIGGER after_cancer_medicine_delete
AFTER DELETE ON cancer_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'cancer';
END//

-- Create triggers for kidney medicines
CREATE TRIGGER after_kidney_medicine_insert
AFTER INSERT ON kidney_disease_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'kidney', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_kidney_medicine_update
AFTER UPDATE ON kidney_disease_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'kidney';
END//

CREATE TRIGGER after_kidney_medicine_delete
AFTER DELETE ON kidney_disease_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'kidney';
END//

-- Create triggers for stroke medicines
CREATE TRIGGER after_stroke_medicine_insert
AFTER INSERT ON stroke_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'stroke', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_stroke_medicine_update
AFTER UPDATE ON stroke_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'stroke';
END//

CREATE TRIGGER after_stroke_medicine_delete
AFTER DELETE ON stroke_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'stroke';
END//

-- Create triggers for arthritis medicines
CREATE TRIGGER after_arthritis_medicine_insert
AFTER INSERT ON arthritis_medicines
FOR EACH ROW
BEGIN
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    VALUES (NEW.name, 'arthritis', NEW.quantity, NEW.reorderPoint, NEW.dosageForm, NEW.dosageStrength, NEW.price, NEW.expirationDate, NEW.image, NEW.batch);
END//

CREATE TRIGGER after_arthritis_medicine_update
AFTER UPDATE ON arthritis_medicines
FOR EACH ROW
BEGIN
    UPDATE medicines 
    SET name = NEW.name,
        quantity = NEW.quantity,
        reorderPoint = NEW.reorderPoint,
        dosageForm = NEW.dosageForm,
        dosageStrength = NEW.dosageStrength,
        price = NEW.price,
        expirationDate = NEW.expirationDate,
        image = NEW.image,
        batch = NEW.batch
    WHERE name = OLD.name AND category = 'arthritis';
END//

CREATE TRIGGER after_arthritis_medicine_delete
AFTER DELETE ON arthritis_medicines
FOR EACH ROW
BEGIN
    DELETE FROM medicines 
    WHERE name = OLD.name AND category = 'arthritis';
END//

-- Create stored procedure to sync existing data
CREATE PROCEDURE sync_medicines()
BEGIN
    -- Clear existing medicines table
    DELETE FROM medicines;
    
    -- Insert from diabetes medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'diabetes', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM diabetes_medicines;
    
    -- Insert from cardiovascular medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'cardiovascular', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM cardiovascular_medicines;
    
    -- Insert from cancer medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'cancer', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM cancer_medicines;
    
    -- Insert from kidney medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'kidney', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM kidney_disease_medicines;
    
    -- Insert from stroke medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'stroke', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM stroke_medicines;
    
    -- Insert from arthritis medicines
    INSERT INTO medicines (name, category, quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch)
    SELECT name, 'arthritis', quantity, reorderPoint, dosageForm, dosageStrength, price, expirationDate, image, batch
    FROM arthritis_medicines;
END//

DELIMITER ;

-- Call the sync procedure to initialize the data
CALL sync_medicines();

-- Cart items table to store medications added to cart
CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    presc_med_id INT NOT NULL,
    provider_id INT NOT NULL,
    patient_id INT NOT NULL,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presc_med_id) REFERENCES presc_med(presc_med_id),
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Orders table to store order information
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('pending', 'confirmed', 'processing', 'ready', 'completed') DEFAULT 'pending',
    delivery_method ENUM('delivery', 'pickup') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
);

-- Order items table to store medications in each order
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    med_id INT NOT NULL,
    presc_med_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (med_id) REFERENCES medicines(med_id),
    FOREIGN KEY (presc_med_id) REFERENCES presc_med(presc_med_id)
);

-- Delivery information table
CREATE TABLE delivery_info (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(15) NOT NULL,
    delivery_notes TEXT,
    preferred_delivery_date DATE,
	preferred_delivery_time TIME,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Create patient notifications table
CREATE TABLE patient_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('order_placed', 'order_status', 'delivery_status') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);