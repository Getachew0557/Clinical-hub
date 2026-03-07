# Auth Service

Backend microservice for managing user authentication, registration, and Role-Based Access Control (RBAC) in the Dental Clinic System.

## Functionality
- **User Management**: Registration, login, and profile fetching.
- **Security**: JWT-based authentication and secure password hashing with bcrypt.
- **RBAC**: Role assignment (Admin, Doctor, Receptionist, Patient) during registration.

## Roles & Permissions

| Role | Actions |
|---|---|
| **Admin** | Full access to create any user role. |
| **Doctor** | Can login and view their own clinical profile. |
| **Receptionist** | Can login and manage patient registrations. |
| **Patient** | Can register self and login to book appointments. |

## API Reference

### Authentication
- `POST /api/auth/register` -> Register a new user.
- `POST /api/auth/login` -> Login and receive JWT.
- `GET /api/auth/me` -> Get current user's details (requires JWT).

## Environment Variables
Create a `.env` file:
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_auth_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

## Postman Testing Guide

### 1. Register a User
- **Method**: `POST`
- **URL**: `http://localhost:5001/api/auth/register`
- **Body (JSON)**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "role": "Patient"
  }
  ```

### 2. Login
- **Method**: `POST`
- **URL**: `http://localhost:5001/api/auth/login`
- **Body (JSON)**:
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```
- **Expected**: `200 OK` with `token`.
