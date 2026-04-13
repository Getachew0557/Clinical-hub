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
    type: {
        type: DataTypes.ENUM('clinic', 'video'),
        defaultValue: 'clinic',
        comment: 'clinic = in-person visit, video = online video consultation'
    }
});

export default Appointment;
