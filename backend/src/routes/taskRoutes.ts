import { Router } from 'express';
import { z } from 'zod';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const attachmentUrlSchema = z.string().optional().nullable().or(z.string().length(0)).refine(
  (val) => {
    if (!val) return true;
    if (val.startsWith('/uploads/')) return true;
    try {
      new URL(val);
      return true;
    } catch (_) {
      return false;
    }
  },
  { message: 'Invalid attachment URL or path' }
);

const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Task title is required' }).min(1, 'Task title cannot be empty'),
    description: z.string().optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime({ message: 'Invalid ISO date string' }).optional().nullable().or(z.string().length(0)),
    attachmentUrl: attachmentUrlSchema,
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean()
    })).optional()
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title cannot be empty').optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional().nullable().or(z.string().length(0)),
    attachmentUrl: attachmentUrlSchema,
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    subtasks: z.array(z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean()
    })).optional()
  }),
});

router.use(authenticate);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
