import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AuditLog — tracks every read/write on sensitive patient data (EMR, billing).
 * Provides a compliance trail for HIPAA-equivalent requirements.
 */
const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User who performed the action'
    },
    actorRole: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    action: {
        type: DataTypes.ENUM('READ', 'CREATE', 'UPDATE', 'DELETE'),
        allowNull: false
    },
    resource: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'e.g. MedicalRecord, Invoice, PatientProfile'
    },
    resourceId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the affected record'
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Patient whose data was accessed (for quick filtering)'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string with additional context'
    }
}, {
    timestamps: true,
    updatedAt: false, // audit logs are immutable
    indexes: [
        { fields: ['actorId'] },
        { fields: ['patientId'] },
        { fields: ['resource'] },
        { fields: ['createdAt'] },
    ]
});

export default AuditLog;
