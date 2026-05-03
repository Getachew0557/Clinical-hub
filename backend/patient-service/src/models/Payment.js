import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Invoice from './Invoice.js';

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    invoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Invoice,
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    method: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Simulated Gateway'
    },
    transactionReference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Success', 'Failed'),
        defaultValue: 'Pending'
    },
    rawData: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    proofUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to uploaded payment receipt/proof image'
    }
}, {
    timestamps: true
});

Invoice.hasMany(Payment, { as: 'payments', foreignKey: 'invoiceId', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

export default Payment;
