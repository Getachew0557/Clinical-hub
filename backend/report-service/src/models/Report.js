import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Appointment', 'Financial', 'Inventory', 'Patient'),
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'JSON blob containing aggregated report data'
    },
    generatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Admin who triggered the report'
    }
}, {
    timestamps: true
});

export default Report;
