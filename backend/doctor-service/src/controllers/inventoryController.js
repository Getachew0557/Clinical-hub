import { Op } from 'sequelize';
import InventoryItem from '../models/InventoryItem.js';
import StockTransaction from '../models/StockTransaction.js';

export const getAllItems = async (req, res) => {
    try {
        const { search, category } = req.query;
        let where = { isActive: true };

        if (search) where.name = { [Op.like]: `%${search}%` };
        if (category) where.category = category;

        const items = await InventoryItem.findAll({ where, order: [['name', 'ASC']] });
        res.status(200).json({ count: items.length, items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createItem = async (req, res) => {
    try {
        const { name, category, quantity, unit, reorderLevel, pricePerUnit } = req.body;

        const existing = await InventoryItem.findOne({ where: { name } });
        if (existing) return res.status(400).json({ message: 'Item with this name already exists' });

        const item = await InventoryItem.create({ name, category, quantity, unit, reorderLevel, pricePerUnit });

        if (quantity > 0) {
            await StockTransaction.create({
                itemId: item.id,
                type: 'In',
                quantity,
                performerId: req.user.id,
                notes: 'Initial stock on creation'
            });
        }

        res.status(201).json({ message: 'Item created successfully', item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, quantity, notes } = req.body;

        if (!['In', 'Out'].includes(type) || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Valid type (In/Out) and positive quantity are required' });
        }

        const item = await InventoryItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (type === 'In') {
            item.quantity += parseInt(quantity);
        } else {
            if (item.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock' });
            item.quantity -= parseInt(quantity);
        }

        await item.save();

        const transaction = await StockTransaction.create({
            itemId: id, type, quantity, performerId: req.user.id, notes
        });

        res.status(200).json({ message: `Stock updated (${type})`, item, transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getItemDetails = async (req, res) => {
    try {
        const item = await InventoryItem.findByPk(req.params.id, {
            include: [{ model: StockTransaction, as: 'transactions', limit: 10, order: [['createdAt', 'DESC']] }]
        });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteItem = async (req, res) => {
    try {
        const item = await InventoryItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        item.isActive = false;
        await item.save();
        res.status(200).json({ message: 'Item deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
