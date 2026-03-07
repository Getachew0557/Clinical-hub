# 📅 Appointment Service

A RESTful microservice for managing dental clinic appointments. Built with **Node.js**, **Express**, **Sequelize**, and **MySQL**. Runs on **port 5003**.

Integrates with the `auth-service` (port 5001) — tokens issued by auth-service are accepted here via a shared `JWT_SECRET`.

---

## 📁 Project Structure

```
appointment-service/
├── server.js                        # Entry point
├── package.json
├── .env
└── src/
    ├── config/
    │   └── database.js              # Sequelize + auto-create DB
    ├── models/
    │   └── Appointment.js           # Appointment Sequelize model
    ├── middlewares/
    │   └── authMiddleware.js        # JWT protect + authorize guards
    ├── controllers/
    │   └── appointmentController.js # Business logic (7 operations)
    └── routes/
        └── appointmentRoutes.js     # Role-guarded route definitions
```

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5003
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=Abc@1221
DB_NAME=dental_appointment_db
JWT_SECRET=<same-secret-as-auth-service>
JWT_EXPIRES_IN=24h
```

> ⚠️ `JWT_SECRET` **must match** the one in `auth-service/.env` exactly.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run in development (auto-restart on change)
npm run dev

# Run in production
npm start
```

The service will automatically:
1. Create the `dental_appointment_db` database if it doesn't exist
2. Connect to MySQL
3. Sync the `Appointments` table (create or alter)
4. Start listening on port 5003

---

## 🗃️ Database Model – `Appointments` Table

| Column | Type | Required | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | Auto | UUIDV4 | Primary key |
| `patientId` | UUID | ✅ | — | Patient's user ID from auth-service |
| `doctorId` | UUID | ✅ | — | Doctor's user ID from auth-service |
| `appointmentDate` | DATEONLY | ✅ | — | Format: `YYYY-MM-DD` |
| `appointmentTime` | TIME | ✅ | — | Format: `HH:MM:SS` |
| `reason` | TEXT | ✅ | — | Reason for visit |
| `status` | ENUM | Auto | `Pending` | `Pending \| Confirmed \| Cancelled \| Completed` |
| `notes` | TEXT | ❌ | null | Internal doctor notes |
| `createdBy` | UUID | Auto | — | User ID of who booked |
| `createdAt` | DATE | Auto | — | Sequelize timestamp |
| `updatedAt` | DATE | Auto | — | Sequelize timestamp |

---

## 🔐 Roles & Permissions

| Action | Admin | Doctor | Receptionist | Patient |
|---|---|---|---|---|
| Create appointment | ✅ any patient | ✅ any patient | ✅ any patient | ✅ **self only** |
| View ALL appointments | ✅ | ❌ 403 | ✅ | ❌ 403 |
| View MY appointments | ✅ | ✅ | ✅ | ✅ |
| View one by ID | ✅ | ✅ own only | ✅ | ✅ own only |
| Update status | ✅ | ✅ | ✅ | ❌ 403 |
| Update/reschedule | ✅ all fields | ✅ notes only | ✅ all fields | ✅ date/time/reason *(Pending only)* |
| Delete | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/health` | None | Public |
| `POST` | `/api/appointments` | Bearer JWT | All roles |
| `GET` | `/api/appointments/my` | Bearer JWT | All roles |
| `GET` | `/api/appointments` | Bearer JWT | Admin, Receptionist |
| `GET` | `/api/appointments/:id` | Bearer JWT | Admin, Receptionist, Owner |
| `PATCH` | `/api/appointments/:id/status` | Bearer JWT | Admin, Doctor, Receptionist |
| `PUT` | `/api/appointments/:id` | Bearer JWT | All (role-scoped fields) |
| `DELETE` | `/api/appointments/:id` | Bearer JWT | Admin only |

---

## 🧪 Postman Testing Guide

### Prerequisites
- `auth-service` running → `http://localhost:5001`
- `appointment-service` running → `http://localhost:5003`
- Postman installed

---

### 🔧 Setup: Postman Environment Variables

Create a Postman Environment with these variables:

| Variable | Initial Value | Description |
|---|---|---|
| `admin_token` | *(empty)* | Filled after Admin login |
| `doctor_token` | *(empty)* | Filled after Doctor login |
| `receptionist_token` | *(empty)* | Filled after Receptionist login |
| `patient_token` | *(empty)* | Filled after Patient login |
| `doctor_id` | *(empty)* | Doctor's UUID from login response |
| `patient_id` | *(empty)* | Patient's UUID from login response |
| `appointment_id` | *(empty)* | Filled after creating an appointment |

**Add this to the Tests tab of every login request** (change variable name per role):
```javascript
const res = pm.response.json();
if (res.token) {
    pm.environment.set("admin_token", res.token);  // change per role
}
if (res.user) {
    pm.environment.set("admin_id", res.user.id);   // change per role
}
```

---

### ✅ STEP 1 — Health Check

Verify the service is running before anything else.

```
Method : GET
URL    : http://localhost:5003/api/health
Auth   : None
```

**Expected Response `200 OK`:**
```json
{
  "service": "appointment-service",
  "status": "healthy"
}
```

---

### 🔑 STEP 2 — Login as Each Role (get tokens)

Repeat this for all 4 roles. Replace email/password with your registered users.

```
Method : POST
URL    : http://localhost:5001/api/auth/login
Headers: Content-Type: application/json
Body   : raw → JSON
```

> ⚠️ **Use the exact email & password you registered in the UI.** Postman and the UI share the same `dental_auth_db` database — the same user account works in both.

**Admin login body** *(seeded by `seed.js`)*:
```json
{
  "email": "admin@ras.dental",
  "password": "adminPassword123"
}
```

**Doctor login body** *(use what you registered in the UI, or register fresh below)*:
```json
{
  "email": "doctor@ras.dental",
  "password": "DoctorPass123!"
}
```

**Receptionist login body:**
```json
{
  "email": "receptionist@ras.dental",
  "password": "ReceptionPass123!"
}
```

**Patient login body:**
```json
{
  "email": "patient@ras.dental",
  "password": "PatientPass123!"
}
```

> 💡 **Need to create Doctor/Receptionist/Patient?** Use `POST http://localhost:5001/api/auth/register` first:
> ```json
> { "fullName": "Dr. John Smith", "email": "doctor@ras.dental", "password": "DoctorPass123!", "role": "Doctor" }
> ```

**Expected Response `200 OK`:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "fullName": "Dr. John Smith",
    "email": "doctor@dentalclinic.com",
    "role": "Doctor"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> 💡 Copy the `token` and `user.id` from each login into your Postman environment variables.

---

### ✅ STEP 3 — Create Appointment as **Admin/Receptionist/Doctor**

Staff can create an appointment for any patient by specifying `patientId`.

```
Method : POST
URL    : http://localhost:5003/api/appointments
Auth   : Bearer Token → {{admin_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**Required fields:**
```json
{
  "patientId": "{{patient_id}}",
  "doctorId": "{{doctor_id}}",
  "appointmentDate": "2026-03-15",
  "appointmentTime": "10:00:00",
  "reason": "Routine dental checkup"
}
```

**Optional fields:**
```json
{
  "notes": "Patient requested morning slot"
}
```

**Expected Response `201 Created`:**
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "appt-uuid-here",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "appointmentDate": "2026-03-15",
    "appointmentTime": "10:00:00",
    "reason": "Routine dental checkup",
    "status": "Pending",
    "notes": null,
    "createdBy": "admin-uuid",
    "createdAt": "2026-03-08T...",
    "updatedAt": "2026-03-08T..."
  }
}
```

> 💡 Save the `appointment.id` into `{{appointment_id}}`.

**Missing required field test** — omit `reason`:
```json
{
  "patientId": "{{patient_id}}",
  "doctorId": "{{doctor_id}}",
  "appointmentDate": "2026-03-15",
  "appointmentTime": "10:00:00"
}
```
**Expected: `400 Bad Request`** → `"doctorId, appointmentDate, appointmentTime, and reason are required"`

---

### ✅ STEP 4 — Create Appointment as **Patient** (self-booking)

Patients cannot specify a `patientId` — it is automatically forced to their own ID.

```
Method : POST
URL    : http://localhost:5003/api/appointments
Auth   : Bearer Token → {{patient_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**Required fields (Patient does NOT send patientId):**
```json
{
  "doctorId": "{{doctor_id}}",
  "appointmentDate": "2026-03-20",
  "appointmentTime": "14:00:00",
  "reason": "Tooth pain and cold sensitivity"
}
```

**Expected Response `201 Created`:**
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "patientId": "<automatically-set-to-your-own-id>",
    ...
    "status": "Pending"
  }
}
```

> 🔒 Even if a Patient sends a different `patientId` in the body, it will be **ignored and replaced** with their own ID.

---

### ✅ STEP 5 — View All Appointments (Admin / Receptionist only)

```
Method : GET
URL    : http://localhost:5003/api/appointments
Auth   : Bearer Token → {{admin_token}}
```

**Optional query parameters:**
```
?status=Pending          → filter by status
?date=2026-03-15         → filter by date
?status=Confirmed&date=2026-03-15  → combined filter
```

**Expected Response `200 OK`:**
```json
{
  "count": 3,
  "appointments": [ ... ]
}
```

---

### ❌ STEP 6 — Patient/Doctor Cannot View All (Expect 403)

```
Method : GET
URL    : http://localhost:5003/api/appointments
Auth   : Bearer Token → {{patient_token}}
```

**Expected Response `403 Forbidden`:**
```json
{
  "message": "Role 'Patient' is not authorized to access this route"
}
```

Same test with `{{doctor_token}}` → same `403 Forbidden`.

---

### ✅ STEP 7 — View My Appointments (Any Role)

Every role can see their own appointments (where they are patient or doctor).

```
Method : GET
URL    : http://localhost:5003/api/appointments/my
Auth   : Bearer Token → {{patient_token}}   ← try with each role
```

**Expected Response `200 OK`:**
```json
{
  "count": 1,
  "appointments": [
    {
      "id": "...",
      "patientId": "your-id",
      ...
    }
  ]
}
```

---

### ✅ STEP 8 — View One Appointment by ID

```
Method : GET
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{admin_token}}
```

**Expected Response `200 OK`:** Full appointment object.

**Ownership test** — try with `{{patient_token}}` for an appointment you are the patient on:
- **Expected:** `200 OK` ✅

**Unauthorized test** — try with `{{patient_token}}` for someone else's appointment:
- **Expected:** `403 Forbidden` ❌

**Not found test:**
```
GET http://localhost:5003/api/appointments/00000000-0000-0000-0000-000000000000
```
**Expected `404 Not Found`:**
```json
{ "message": "Appointment not found" }
```

---

### ✅ STEP 9 — Update Status (Admin / Doctor / Receptionist)

```
Method : PATCH
URL    : http://localhost:5003/api/appointments/{{appointment_id}}/status
Auth   : Bearer Token → {{doctor_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**Required field:**
```json
{
  "status": "Confirmed"
}
```

Valid values: `Pending`, `Confirmed`, `Cancelled`, `Completed`

**Expected Response `200 OK`:**
```json
{
  "message": "Status updated from 'Pending' to 'Confirmed'",
  "appointment": { "status": "Confirmed", ... }
}
```

**Invalid status test:**
```json
{ "status": "Approved" }
```
**Expected `400 Bad Request`:**
```json
{
  "message": "Invalid status. Must be one of: Pending, Confirmed, Cancelled, Completed"
}
```

---

### ❌ STEP 10 — Patient Cannot Update Status (Expect 403)

```
Method : PATCH
URL    : http://localhost:5003/api/appointments/{{appointment_id}}/status
Auth   : Bearer Token → {{patient_token}}
Body   : { "status": "Cancelled" }
```

**Expected Response `403 Forbidden`:**
```json
{
  "message": "Role 'Patient' is not authorized to access this route"
}
```

---

### ✅ STEP 11 — Patient Reschedules Own Appointment

Patient can only update `appointmentDate`, `appointmentTime`, and `reason` — only if the appointment is still `Pending`.

```
Method : PUT
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{patient_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**Allowed fields for Patient:**
```json
{
  "appointmentDate": "2026-03-25",
  "appointmentTime": "09:00:00",
  "reason": "Changed to morning slot, same issue"
}
```

**Expected Response `200 OK`:**
```json
{
  "message": "Appointment updated successfully",
  "appointment": { "appointmentDate": "2026-03-25", ... }
}
```

**Already Confirmed — cannot reschedule test:**
*(First confirm it with doctor token, then try to reschedule as Patient)*
```json
{ "appointmentDate": "2026-03-30" }
```
**Expected `400 Bad Request`:**
```json
{
  "message": "You can only reschedule appointments that are still Pending"
}
```

---

### ✅ STEP 12 — Doctor Adds Notes

Doctor can only update `notes` on appointments where they are the doctor.

```
Method : PUT
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{doctor_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**Allowed field for Doctor:**
```json
{
  "notes": "Patient has stage 2 gingivitis. Prescribed Chlorhexidine mouthwash. Follow-up in 2 weeks."
}
```

**Expected Response `200 OK`:**
```json
{
  "message": "Appointment updated successfully",
  "appointment": { "notes": "Patient has stage 2 gingivitis...", ... }
}
```

---

### ✅ STEP 13 — Admin/Receptionist Full Update

Admin and Receptionist can update all fields.

```
Method : PUT
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{admin_token}}
Headers: Content-Type: application/json
Body   : raw → JSON
```

**All updatable fields:**
```json
{
  "patientId": "{{patient_id}}",
  "doctorId": "{{doctor_id}}",
  "appointmentDate": "2026-04-01",
  "appointmentTime": "11:30:00",
  "reason": "Updated reason — cavity filling",
  "notes": "Admin rescheduled on patient's behalf",
  "status": "Confirmed"
}
```

**Expected Response `200 OK`:** Full updated appointment object.

---

### ✅ STEP 14 — Admin Deletes Appointment

```
Method : DELETE
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{admin_token}}
```

**Expected Response `200 OK`:**
```json
{
  "message": "Appointment deleted successfully"
}
```

**Verify deletion:**
```
GET http://localhost:5003/api/appointments/{{appointment_id}}
Auth: {{admin_token}}
```
**Expected `404 Not Found`:**
```json
{ "message": "Appointment not found" }
```

---

### ❌ STEP 15 — Doctor/Receptionist Cannot Delete (Expect 403)

```
Method : DELETE
URL    : http://localhost:5003/api/appointments/{{appointment_id}}
Auth   : Bearer Token → {{doctor_token}}
```

**Expected Response `403 Forbidden`:**
```json
{
  "message": "Role 'Doctor' is not authorized to access this route"
}
```

Same test with `{{receptionist_token}}` → same `403 Forbidden`.

---

### ❌ STEP 16 — No Token (Expect 401)

Any protected endpoint without a token:

```
Method : GET
URL    : http://localhost:5003/api/appointments
Auth   : None
```

**Expected Response `401 Unauthorized`:**
```json
{
  "message": "Not authorized, no token"
}
```

Invalid/expired token:
```
Authorization: Bearer someinvalidtoken123
```
**Expected `401 Unauthorized`:**
```json
{
  "message": "Not authorized, token failed"
}
```

---

## 🔄 Full Test Scenario (End-to-End)

Run through this sequence to validate the complete workflow:

```
1.  GET  /api/health                           → 200 ✅ service alive
2.  POST /api/auth/login (all 4 roles)         → save tokens
3.  POST /api/appointments [Patient]           → 201 ✅ save appointment_id
4.  GET  /api/appointments [Patient]           → 403 ❌ role blocked
5.  GET  /api/appointments [Admin]             → 200 ✅ sees all
6.  GET  /api/appointments/my [Doctor]         → 200 ✅ sees own schedule
7.  GET  /api/appointments/:id [Patient]       → 200 ✅ own appointment
8.  PATCH/:id/status [Doctor] Confirmed        → 200 ✅ status updated
9.  PATCH/:id/status [Patient]                 → 403 ❌ role blocked
10. PUT  /:id [Patient] reschedule (Confirmed) → 400 ❌ not Pending
11. POST /api/appointments [Patient] (new)     → 201 ✅ Pending
12. PUT  /:id [Patient] reschedule (Pending)   → 200 ✅ rescheduled
13. PUT  /:id [Doctor] add notes               → 200 ✅ notes saved
14. PUT  /:id [Admin] full update              → 200 ✅ all fields updated
15. DELETE /:id [Receptionist]                 → 403 ❌ role blocked
16. DELETE /:id [Admin]                        → 200 ✅ deleted
17. GET  /:id [Admin] (deleted)                → 404 ❌ not found
```

---

## 🛠️ Common Errors Reference

| Status | Message | Cause |
|---|---|---|
| `400` | `patientId is required` | Admin/Doctor/Receptionist didn't send `patientId` |
| `400` | `doctorId, appointmentDate, appointmentTime, and reason are required` | Missing required body fields |
| `400` | `Invalid status. Must be one of: ...` | Wrong status string in PATCH body |
| `400` | `You can only reschedule appointments that are still Pending` | Patient tried to reschedule non-Pending appointment |
| `401` | `Not authorized, no token` | Missing `Authorization` header |
| `401` | `Not authorized, token failed` | Invalid or expired JWT |
| `403` | `Role 'X' is not authorized to access this route` | Role not allowed for that endpoint |
| `403` | `Not authorized to view/edit this appointment` | Ownership check failed (not your appointment) |
| `404` | `Appointment not found` | Wrong or deleted appointment ID |
| `500` | `<error message>` | Server/database error |
