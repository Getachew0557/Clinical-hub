import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'UUID of the patient (references Users in auth-service)'
    },
    doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'UUID of the doctor (references Users in auth-service)'
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'),
        defaultValue: 'Pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Internal notes — typically added by Doctor'
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'UUID of the user who created this appointment'
    },
    isAdminApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Must be true for Doctors to see/confirm the appointment'
    },
    confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the appointment was confirmed'
    },
    confirmedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'UUID of the user who confirmed the appointment'
    },
    confirmedByName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Full name of the user who confirmed (denormalized for display)'
    },
    patientName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Denormalized patient full name — stored at booking time for reliable display'
    },
    doctorName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Denormalized doctor full name — stored at booking time for reliable display'
    },
    type: {
        type: DataTypes.ENUM('clinic', 'video'),
        defaultValue: 'clinic',
        comment: 'clinic = in-person visit, video = online video consultation'
    },
    attachmentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional file attachment (image/PDF) uploaded by patient'
    },
    hospitalName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name of the hospital selected for clinic visits'
    }
});

export default Appointment;
