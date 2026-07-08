import { Router } from 'express';
import { uploadAvatarController, uploadAttachmentController } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAvatar, uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

// Avatar Upload Endpoint
router.post('/avatar', uploadAvatar, uploadAvatarController);

// General Attachment Upload Endpoint
router.post('/attachment', uploadAttachment, uploadAttachmentController);

export default router;
