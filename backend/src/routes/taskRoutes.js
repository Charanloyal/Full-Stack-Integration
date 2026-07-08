import { Router } from 'express';
import { z } from 'zod';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Zod schemas
const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Task title is required' }).min(1, 'Task title cannot be empty'),
    description: z.string().optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime({ message: 'Invalid ISO date string' }).optional().nullable().or(z.string().length(0)),
    attachmentUrl: z.string().url('Invalid attachment URL').optional().nullable().or(z.string().length(0)),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title cannot be empty').optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional().nullable().or(z.string().length(0)),
    attachmentUrl: z.string().url().optional().nullable().or(z.string().length(0)),
  }),
});

// All routes require authentication
router.use(authenticate);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
