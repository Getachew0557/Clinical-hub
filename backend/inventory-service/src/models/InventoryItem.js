import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InventoryItem = sequelize.define('InventoryItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'e.g., Equipment, Supplies, Meds'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'e.g., Boxes, Pieces, Packs'
    },
    reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },
    pricePerUnit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

export default InventoryItem;
