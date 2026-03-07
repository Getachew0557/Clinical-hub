import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getAllItems,
    getItemDetails,
    createItem,
    updateStock,
    deleteItem
} from '../controllers/inventoryController.js';

const router = express.Router();

// ─── Routes ────────────────────────────────────────────────────────────────

// View items - (All Staff: Admin, Doctor, Receptionist)
router.get('/', protect, authorize('Admin', 'Doctor', 'Receptionist'), getAllItems);

// View details & history
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Receptionist'), getItemDetails);

// Management - (Admin/Receptionist Only)
router.post('/', protect, authorize('Admin', 'Receptionist'), createItem);
router.patch('/:id/stock', protect, authorize('Admin', 'Receptionist'), updateStock);
router.delete('/:id', protect, authorize('Admin'), deleteItem);

export default router;
