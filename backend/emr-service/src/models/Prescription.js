import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import MedicalRecord from './MedicalRecord.js';

const Prescription = sequelize.define('Prescription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    recordId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: MedicalRecord,
            key: 'id'
        }
    },
    medication: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dosage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    frequency: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

// Associations
MedicalRecord.hasMany(Prescription, { as: 'prescriptions', foreignKey: 'recordId', onDelete: 'CASCADE' });
Prescription.belongsTo(MedicalRecord, { foreignKey: 'recordId' });

export default Prescription;
