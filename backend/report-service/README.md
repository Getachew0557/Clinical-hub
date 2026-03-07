# Report Service

Backend microservice for clinic analytics and management reports.

## Functionality
- **Appointment Analytics**: Summarize scheduling trends and status distributions.
- **Inventory Overview**: High-level stock valuation and low-stock summaries.
- **Patient Demographics**: Age and gender distribution reports.
- **Report Persistence**: Save and retrieve historical analytical reports.

## Roles & Permissions

| Role | Actions |
|---|---|
| **Admin** | Full access to generate and view all analytical reports. |
| **Doctor** | No access (restricted to clinical data). |
| **Receptionist** | No access (restricted to front-desk operations). |
| **Patient** | No access. |

## API Reference

### Analytics (Admin)
- `GET /api/reports/appointments/stats` -> Appointment trends.
- `GET /api/reports/inventory/summary` -> Stock valuation and levels.
- `GET /api/reports/patients/demographics` -> Demographic breakdown.

### Saved Reports
- `GET /api/reports/saved` -> List all saved report snapshots.
- `POST /api/reports/save` -> Persist a report snapshot.

## Environment Variables
```env
PORT=5007
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_report_db
JWT_SECRET=your_jwt_secret
```

## Postman Testing Guide

### 1. Fetch Stats (Admin)
- **Method**: `GET`
- **URL**: `http://localhost:5007/api/reports/appointments/stats`
- **Auth**: `Bearer {{admin_token}}`
- **Expected**: JSON summary of appointment data.

### 2. Unauthorized Access (Doctor)
- **Auth**: `Bearer {{doctor_token}}`
- **Expected**: `403 Forbidden`.

### 3. Save a Report
- **Method**: `POST`
- **URL**: `http://localhost:5007/api/reports/save`
- **Body (JSON)**:
  ```json
  {
    "title": "Quarterly Appointment Summary",
    "type": "Appointment",
    "data": { "total": 150, "growth": "12%" }
  }
  ```
