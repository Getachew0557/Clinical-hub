import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { 
    getAllHospitals, 
    getHospitalById, 
    createHospital, 
    updateHospital, 
    deleteHospital 
} from '../controllers/hospitalController.js';

const router = express.Router();

// Multer setup for logos
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `hospital-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Public routes
router.get('/', getAllHospitals);
router.get('/:id', getHospitalById);

// Protected routes (Admin/Receptionist only)
router.post('/', protect, authorize('Admin', 'Receptionist'), upload.single('logo'), createHospital);
router.put('/:id', protect, authorize('Admin', 'Receptionist'), upload.single('logo'), updateHospital);
router.delete('/:id', protect, authorize('Admin'), deleteHospital);

export default router;
