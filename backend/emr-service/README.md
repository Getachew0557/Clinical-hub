Backend microservice for managing Electronic Medical Records (EMR) and prescriptions in the Dental Clinic System.

## Functionality
- **Clinical Records**: Create and manage detailed medical records for patient visits.
- **Prescription System**: Issue medication prescriptions linked to specific medical records.
- **Role Isolation**: Ensures sensitive clinical data is only accessible to authorized medical staff and the patient owner.
- **History Tracking**: Maintain a persistent history of clinical diagnoses and treatments.

---

## Project Structure
```text
emr-service/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # MedicalRecord & Prescription logic
│   ├── middlewares/     # JWT Auth & Authorization
│   ├── models/          # MedicalRecord & Prescription models
│   └── routes/          # API endpoints
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json         # Dependencies
```

## Environment Variables
Create a `.env` file:
```env
PORT=5004
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_emr_db
JWT_SECRET=your_jwt_secret
```

## Getting Started
1. Install dependencies: `npm install`
2. Run development: `npm run dev`

## Roles & Permissions
- **Admin**: Full access to all records (View, Update, Delete).
- **Doctor**: Can create records, view patient indices, and update their own records.
- **Patient**: Can view their own medical records and prescriptions only.
- **Receptionist**: No access to clinical medical records.

## API Reference

### Records & Prescriptions
- `POST /api/emr` -> Create record with prescriptions (Doctor only).
- `GET /api/emr/patient/:patientId` -> View all records for a patient (Owner/Doctor/Admin).
- `GET /api/emr/:id` -> Single record detail with prescriptions.
- `PUT /api/emr/:id` -> Update record/prescriptions (Original Doctor/Admin).
- `DELETE /api/emr/:id` -> Remove record (Admin only).

---

## Postman Testing Guide

### 1. Create Medical Record (with Prescriptions)
- **Responsibility**: Doctor
- **Method**: `POST`
- **URL**: `http://localhost:5004/api/emr`
- **Header**: `Authorization: Bearer <doctor_token>`
- **Body (JSON)**:
  ```json
  {
    "patientId": "<patient-uuid>",
    "appointmentId": "<appointment-uuid>",
    "diagnosis": "Severe tooth decay on upper right molars",
    "treatment": "Root canal treatment performed",
    "notes": "Patient advised to avoid cold drinks for 48 hours",
    "prescriptions": [
      {
        "medication": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "Three times daily",
        "duration": "7 days"
      }
    ]
  }
  ```
- **Expected Response**: `201 Created` with full record and prescription objects.

### 2. View My Records (As Patient)
- **Responsibility**: Patient
- **Method**: `GET`
- **URL**: `http://localhost:5004/api/emr/patient/<my-uuid>`
- **Expected Response**: `200 OK` with list of records.

### 3. Negative Case: Unauthorized View
- **Method**: `GET`
- **URL**: `http://localhost:5004/api/emr/patient/<another-patient-uuid>`
- **Header**: `Authorization: Bearer <patient_token>`
- **Expected Response**: `403 Forbidden`.

### 4. Negative Case: Receptionist Access
- **Header**: `Authorization: Bearer <receptionist_token>`
- **URL**: `http://localhost:5004/api/emr/patient/<any-uuid>`
- **Expected Response**: `403 Forbidden`.
