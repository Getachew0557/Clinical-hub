import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    analyzeDiagnosis,
    suggestTreatment,
    publicChat,
    aiChat
} from '../controllers/aiController.js';

const router = express.Router();

// ─── Public Routes ───
router.post('/public-chat', publicChat);

// ─── Private Routes (Doctor / Admin Only) ───
router.use(protect);
router.use(authorize('Doctor', 'Admin'));

router.post('/analyze-diagnosis', analyzeDiagnosis);
router.post('/suggest-treatment', suggestTreatment);
router.post('/chat', aiChat);

export default router;
