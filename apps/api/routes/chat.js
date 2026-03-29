import express from 'express';
import { chatWithAI } from '../controller/chatController.js';

const router = express.Router();

// Route cho khách hàng chat với AI
router.post('/', chatWithAI);

export default router;
