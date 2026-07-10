import { Router } from 'express';
import { getSecurityLogs } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/logs', authenticate, authorize('ADMIN'), getSecurityLogs);

export default router;
