# 🏥 Doctor Service

A microservice for managing doctor profiles, schedules, and specializations. Built with **Node.js**, **Express**, **Sequelize**, and **MySQL**. Runs on **port 5010**.

This service allows administrators to manage doctor records and link them to user accounts in the `auth-service`. It also allows doctors to manage their own professional profiles.

---

## 📁 Project Structure

```
doctor-service/
├── server.js                        # Entry point
├── package.json
├── .env
├── uploads/                         # Directory for profile photos
└── src/
    ├── config/
    │   └── database.js              # Database connection
    ├── models/
    │   └── DoctorProfile.js         # Doctor profile model
    ├── middlewares/
    │   └── authMiddleware.js        # JWT protection & roles
    ├── controllers/
    │   └── doctorController.js      # Business logic
    └── routes/
        └── doctorRoutes.js          # API routes
```

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5010
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=Abc@1221
DB_NAME=dental_doctor_db
JWT_SECRET=9bf0d8211778c3fd59351f8482db2a68c32cbebd1d1f91817cf4867255c93309
JWT_EXPIRES_IN=24h
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Create uploads directory (if not exists)
mkdir uploads

# Run in development mode
npm run dev
```

---

## 🗃️ Database Model – `DoctorProfiles` Table

| Column | Type | Required | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | Auto | UUIDV4 | Primary key |
| `userId` | UUID | ✅ | — | Link to `auth-service` User ID |
| `fullName` | STRING | ✅ | — | Professional name |
| `email` | STRING | ✅ | — | Professional email (unique) |
| `phone` | STRING | ❌ | — | Contact number |
| `specialization`| STRING | ✅ | — | E.g., Orthodontics, Oral Surgery |
| `licenseNumber` | STRING | ✅ | — | Medical license number (unique) |
| `experience` | INTEGER| ❌ | — | Years of experience |
| `qualification` | STRING | ❌ | — | E.g., DDS, BDS, MDS |
| `bio` | TEXT | ❌ | — | Professional biography |
| `workingDays` | JSON | ❌ | — | E.g., `["Monday", "Wednesday"]` |
| `workingHoursStart`| TIME | ❌ | — | Shift start time |
| `workingHoursEnd` | TIME | ❌ | — | Shift end time |
| `consultationFee`| DECIMAL| ❌ | — | Standard fee |
| `profilePhoto` | STRING | ❌ | — | Path to uploaded image |
| `isActive` | BOOLEAN| Auto | `true` | Active status |

---

## 🔐 Roles & Permissions

| Action | Admin | Receptionist | Doctor | Patient |
|---|---|---|---|---|
| Create Profile | ✅ | ❌ | ❌ | ❌ |
| View All Profiles | ✅ | ✅ | ❌ | ❌ |
| View Specific ID | ✅ | ✅ | ✅ (Own Only) | ❌ |
| Update Profile | ✅ (Alt) | ❌ | ✅ (Limited) | ❌ |
| Toggle Status | ✅ | ❌ | ❌ | ❌ |
| Delete Profile | ✅ | ❌ | ❌ | ❌ |

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `GET` | `/api/health` | None | Public |
| `POST` | `/api/doctors` | ✅ JWT | Admin |
| `GET` | `/api/doctors` | ✅ JWT | Admin, Receptionist |
| `GET` | `/api/doctors/my-profile` | ✅ JWT | Doctor |
| `GET` | `/api/doctors/:id` | ✅ JWT | Admin, Receptionist, Owner |
| `PUT` | `/api/doctors/:id` | ✅ JWT | Admin, Owner (Doctor) |
| `PATCH` | `/api/doctors/:id/status` | ✅ JWT | Admin |
| `DELETE` | `/api/doctors/:id` | ✅ JWT | Admin |

---

## 🧪 Postman Testing Guide

### Prerequisites
- `auth-service` running → `http://localhost:5001`
- `doctor-service` running → `http://localhost:5010`

---

### 🔑 STEP 1 — Login to Get Tokens

> ⚠️ Always use the credentials registered in the UI or existing in `seed.js`.

**Admin Login:**
```
POST http://localhost:5001/api/auth/login
{ "email": "admin@ras.dental", "password": "adminPassword123" }
```

**Doctor Registration (if needed):**
```
POST http://localhost:5001/api/auth/login
{ "email": "doctor@ras.dental", "password": "DoctorPass123!" }
```

---

### ✅ STEP 2 — Create Doctor Profile (Admin Only)

Admin must link a `userId` from the `auth-service` to a new profile here.

```
Method : POST
URL    : http://localhost:5010/api/doctors
Auth   : Bearer Token → {{admin_token}}
Body   : form-data
```

**Fields:**
- `userId`: `uuid-from-auth-service`
- `fullName`: Dr. Emily Stone
- `email`: emily.stone@clinic.com
- `specialization`: General Dentistry
- `licenseNumber`: GD-998877
- `profilePhoto`: (Attach File)

**Expected Response `201 Created`:**
```json
{
  "message": "Doctor profile created successfully",
  "doctor": { "id": "doctor-id", "fullName": "Dr. Emily Stone", ... }
}
```

**❌ Negative Test — Missing Field:**
Omit `licenseNumber`.
**Expected `400 Bad Request`**: `"userId, fullName, email, specialization, and licenseNumber are required"`

---

### ✅ STEP 3 — View All Doctors (Admin/Receptionist)

```
Method : GET
URL    : http://localhost:5010/api/doctors?specialization=General Dentistry
Auth   : Bearer Token → {{admin_token}}
```

**Expected Response `200 OK`**: List of doctors.

**❌ Negative Test — Patient Unauthorized:**
Try with `{{patient_token}}`.
**Expected `403 Forbidden`**: `"Role 'Patient' is not authorized to access this route"`

---

### ✅ STEP 4 — Doctor Fetches Their Own Profile

```
Method : GET
URL    : http://localhost:5010/api/doctors/my-profile
Auth   : Bearer Token → {{doctor_token}}
```

**Expected Response `200 OK`**: The doctor's full profile record.

---

### ✅ STEP 5 — Update Profile (Doctor Limited Edit)

Doctors can update their bio, phone, and schedule, but NOT their license or email.

```
Method : PUT
URL    : http://localhost:5010/api/doctors/{{doctor_id}}
Auth   : Bearer Token → {{doctor_token}}
Body   : raw -> JSON
```

**Body:**
```json
{
  "bio": "Experienced dentist specializing in extractions.",
  "consultationFee": 150.00
}
```

**Expected Response `200 OK`**: Updated profile.

**❌ Negative Test — Doctor Edits Others:**
Try to edit a different `doctor_id`.
**Expected `403 Forbidden`**: `"Not authorized to edit this profile"`

---

### ✅ STEP 6 — Toggle Status (Admin Only)

```
Method : PATCH
URL    : http://localhost:5010/api/doctors/{{doctor_id}}/status
Auth   : Bearer Token → {{admin_token}}
Body   : { "isActive": false }
```

**Expected Response `200 OK`**: `"Doctor deactivated successfully"`

---

### ✅ STEP 7 — Delete Profile (Admin Only)

```
Method : DELETE
URL    : http://localhost:5010/api/doctors/{{doctor_id}}
Auth   : Bearer Token → {{admin_token}}
```

**Expected Response `200 OK`**: `"Doctor profile deleted successfully"`

---

## 🔄 End-to-End Test Sequence

1. **GET** `/api/health` → `200 OK`
2. **POST** Profile as Admin → `201 Created`
3. **GET** All Profiles as Receptionist → `200 OK`
4. **GET** My Profile as Doctor → `200 OK`
5. **PUT** Update Bio as Doctor → `200 OK`
6. **PATCH** Deactivate as Patient → `403 Forbidden` ❌
7. **DELETE** Profile as Admin → `200 OK`
