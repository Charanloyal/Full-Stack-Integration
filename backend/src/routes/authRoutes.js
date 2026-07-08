import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, getMe, triggerTestEmail } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Zod Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters long'),
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters long'),
    role: z.string().optional(), // USER or ADMIN
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

// Routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/test-email', authenticate, triggerTestEmail);

export default router;
