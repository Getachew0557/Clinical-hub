import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import InventoryItem from './InventoryItem.js';

const StockTransaction = sequelize.define('StockTransaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: InventoryItem,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('In', 'Out'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    performerId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who performed the audit'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

// Associations
InventoryItem.hasMany(StockTransaction, { foreignKey: 'itemId', as: 'transactions', onDelete: 'CASCADE' });
StockTransaction.belongsTo(InventoryItem, { foreignKey: 'itemId' });

export default StockTransaction;
