# Notification Service

Backend microservice for managing in-app alerts and notifications in the Dental Clinic System.

## Functionality
- **In-App Alerts**: Real-time (simulated via polling) notifications for users.
- **Cross-Service Integration**: APIs for other services to trigger notifications.
- **State Management**: Users can mark notifications as read or delete them.
- **Filtering**: Fetch all, read, or unread alerts for the logged-in user.

## Roles & Permissions

| Role | Actions |
|---|---|
| **Admin** | Can create notifications for any user; full management. |
| **Doctor** | Can view and manage their own notifications. |
| **Receptionist** | Can view and manage their own notifications. |
| **Patient** | Can view and manage their own notifications. |

## API Reference

### User Notifications
- `GET /api/notifications/my` -> Fetch all notifications for the current user.
- `PATCH /api/notifications/:id/read` -> Mark a specific alert as read.
- `PATCH /api/notifications/read-all` -> Mark all user alerts as read.
- `DELETE /api/notifications/:id` -> Remove an alert.

### System/Admin (Internal)
- `POST /api/notifications` -> Trigger a new notification for a specific `userId`. (Admin Only).

## Environment Variables
```env
PORT=5008
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_notification_db
JWT_SECRET=your_jwt_secret
```

## Postman Testing Guide

### 1. Trigger Notification (Admin Only)
- **Method**: `POST`
- **URL**: `http://localhost:5008/api/notifications`
- **Auth**: `Bearer {{admin_token}}`
- **Body (JSON)**:
  ```json
  {
    "userId": "<target-user-uuid>",
    "title": "Appointment Confirmed",
    "message": "Your appointment for tomorrow at 10:00 AM has been confirmed.",
    "type": "Success",
    "link": "/appointments"
  }
  ```

### 2. Fetch My Notifications
- **Method**: `GET`
- **URL**: `http://localhost:5008/api/notifications/my`
- **Auth**: `Bearer {{target_user_token}}`
- **Expected**: List of notifications for that user.

### 3. Mark as Read
- **Method**: `PATCH`
- **URL**: `http://localhost:5008/api/notifications/<id>/read`
- **Expected**: `200 OK` with `isRead: true`.
