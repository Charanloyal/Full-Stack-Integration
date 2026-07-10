import { Router } from 'express';
import { getChatMessages } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getChatMessages);

export default router;
