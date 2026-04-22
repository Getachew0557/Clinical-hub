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

router.get('/', protect, authorize('Admin', 'Doctor', 'Receptionist'), getAllItems);
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Receptionist'), getItemDetails);
router.post('/', protect, authorize('Admin', 'Receptionist'), createItem);
router.patch('/:id/stock', protect, authorize('Admin', 'Receptionist'), updateStock);
router.delete('/:id', protect, authorize('Admin'), deleteItem);

export default router;
