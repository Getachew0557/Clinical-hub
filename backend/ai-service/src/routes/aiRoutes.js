import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    analyzeDiagnosis,
    suggestTreatment,
    publicChat,
    aiChat,
    contextAssistant
} from '../controllers/aiController.js';

const router = express.Router();

// ─── Public Routes ───
router.post('/public-chat', publicChat);

// ─── Private Routes (Authenticated Users) ───
router.use(protect);

router.post('/context-assistant', contextAssistant);

// ─── Doctor / Admin Only ───
router.post('/analyze-diagnosis', authorize('Doctor', 'Admin'), analyzeDiagnosis);
router.post('/suggest-treatment', authorize('Doctor', 'Admin'), suggestTreatment);
router.post('/chat', authorize('Doctor', 'Admin'), aiChat);

export default router;
