# RePill - Medication Refill Application
<img src="assets/RePill.gif" alt="Preview RePill App GIF" width="1200px" />

RePill is a long-term medication refilling application designed for both patients and healthcare providers.

### Key Features:
- **For Patients:**
  * Avoid long queues at hospitals for long-term medications
  * View medical records and prescriptions easily
  * Confirm delivery or self-pickup options

- **For Healthcare Providers:**
  * Create, edit, and update medical records and prescriptions
  * Process refill orders following patient doctor visits
  * Manage medication inventory including restocking

## Prerequisites
- **Node.js:** Download from [nodejs.org](https://nodejs.org/)
- **MySQL:** Install and configure database server
- **Android Studio/Xcode:** Required for mobile app development
- **Visual Studio Code:** Or any preferred code editor

## How to Run the Project:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Lithia22/CAT304_Project.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd CAT304_Project
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set up Database**
   * Start MySQL server
   * Run the included SQL script:
   ```bash
   mysql -u username -p < RePill.sql
   ```

5. **Configure the application**
   * Update `config.js` with your database credentials
   * Update `EmailSender.js` with your email credentials

6. **Start the backend server**
   ```bash
   node server.js
   ```

7. **Start the React Native app (in a new terminal)**
   ```bash
   npm start
   ```

8. **Run on device/emulator**
   * Press `a` for Android
   * Press `i` for iOS

## Technology Stack
- **Frontend:** React Native
- **Backend:** Express.js, Node.js
- **Database:** MySQL

## Team Members & Responsibilities

* **Lithia:** User Registration and Medical Record Module
* **Tejashree:** Prescription Module
* **Kavita:** Inventory Management Module
* **Dershyani:** Refill Order Module
