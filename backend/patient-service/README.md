# Patient Service

Backend microservice for managing patient profiles, medical history, and demographics in the Dental Clinic System.

## Project Structure
```text
patient-service/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middlewares/     # Auth & validation
│   ├── models/          # Sequelize models
│   └── routes/          # API endpoints
├── uploads/             # Patient profile photos
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json         # Dependencies
```

## Environment Variables
Create a `.env` file in the root:
```env
PORT=5002
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_patient_db
JWT_SECRET=your_jwt_secret
```

## Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Database Model (PatientProfiles)
| Field | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key |
| **userId** | UUID | Link to Auth service |
| **fullName** | String | Patient name |
| **email** | String | Unique email |
| **dateOfBirth** | Date | Required for age calculation |
| **bloodGroup** | Enum | A+, O-, etc. |
| **profilePhoto** | String | Path to image |

## Roles & Permissions
- **Admin**: Full access (Create, View All, Update, Delete).
- **Receptionist**: Create and View profiles.
- **Doctor**: View profiles and medical history.
- **Patient**: View and Update *only their own* profile.

## API Reference

### Health Check
- `GET /api/health` -> Status of the service.

### Patient Management
- `GET /api/patients` -> List all (Staff only).
- `POST /api/patients` -> Create new profile (Staff only).
- `GET /api/patients/my-profile` -> My own details (Patient only).
- `GET /api/patients/:id` -> Single profile details.
- `PUT /api/patients/:id` -> Update profile (Admin/Owner).
- `PATCH /api/patients/:id/status` -> Toggle active/inactive (Admin).
- `DELETE /api/patients/:id` -> Remove profile (Admin).

---

## Postman Testing Guide

### 1. Prerequisite: Authentication
- **Step**: Login via `auth-service` (Port 5001) as Admin, Doctor, or Patient to get a JWT token.
- **Header**: Set `Authorization: Bearer <your_token>`.

### 2. Create Patient Profile
- **Responsibility**: Admin / Receptionist
- **Method**: `POST`
- **URL**: `http://localhost:5002/api/patients`
- **Body**: `form-data`
  - `userId`: (Get a valid patient UUID from `dental_auth_db`)
  - `fullName`: "John Doe"
  - `email`: "john.doe@example.com"
  - `phone`: "+123456789"
  - `gender`: "Male"
  - `dateOfBirth`: "1990-05-15"
  - `bloodGroup`: "O+"
  - `profilePhoto`: (Select a file)
- **Expected Response**: `201 Created` with profile data.

### 3. Fetch My Profile (As Patient)
- **Responsibility**: Patient
- **Method**: `GET`
- **URL**: `http://localhost:5002/api/patients/my-profile`
- **Expected Response**: Returns John Doe's profile.

### 4. Negative Case: Unauthorized Delete
- **Responsibility**: Patient / Receptionist
- **Method**: `DELETE`
- **URL**: `http://localhost:5002/api/patients/<id>`
- **Expected Response**: `403 Forbidden`. Only Admins can delete.

### 5. Negative Case: Expired/Missing Token
- **Method**: `GET`
- **URL**: `http://localhost:5002/api/patients`
- **Header**: Remove Authorization
- **Expected Response**: `401 Unauthorized`.
