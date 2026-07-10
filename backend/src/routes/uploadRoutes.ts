import { Router } from 'express';
import { uploadAvatarController, uploadAttachmentController } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAvatar, uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/avatar', uploadAvatar, uploadAvatarController);
router.post('/attachment', uploadAttachment, uploadAttachmentController);

export default router;
