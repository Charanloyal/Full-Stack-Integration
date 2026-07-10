import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';
import { sendTaskNotification } from '../services/emailService.js';
import { cacheGet, cacheSet, cacheDel } from '../services/redisService.js';

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'workspace:tasks';
    const cachedTasks = await cacheGet<any[]>(cacheKey);

    if (cachedTasks) {
      console.log('[Task Controller] Returning cached tasks list from Redis');
      return res.status(200).json({
        status: 'success',
        tasks: cachedTasks,
      });
    }

    const tasks = await prisma.task.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedTasks = tasks.map((task) => ({
      ...task,
      subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
    }));

    await cacheSet(cacheKey, formattedTasks, 300);

    return res.status(200).json({
      status: 'success',
      tasks: formattedTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const { title, description, status, dueDate, attachmentUrl, priority, subtasks } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        attachmentUrl: attachmentUrl || null,
        priority: priority || 'MEDIUM',
        subtasks: subtasks ? JSON.stringify(subtasks) : JSON.stringify([]),
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formattedTask = {
      ...task,
      subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
    };

    // Invalidate Redis cache
    await cacheDel('workspace:tasks');

    sendTaskNotification(req.user, formattedTask, 'created').catch((e) =>
      console.error('Error sending task notification email:', e)
    );

    if (req.io) {
      req.io.emit('task_created', formattedTask);
    }

    return res.status(201).json({
      status: 'success',
      task: formattedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const { id } = req.params as { id: string };
    const { title, description, status, dueDate, attachmentUrl, priority, subtasks } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTask.dueDate,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existingTask.attachmentUrl,
        priority: priority !== undefined ? priority : existingTask.priority,
        subtasks: subtasks !== undefined ? JSON.stringify(subtasks) : existingTask.subtasks,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formattedTask = {
      ...updatedTask,
      subtasks: updatedTask.subtasks ? JSON.parse(updatedTask.subtasks) : [],
    };

    // Invalidate Redis cache
    await cacheDel('workspace:tasks');

    sendTaskNotification(req.user, formattedTask, `updated (status: ${formattedTask.status})`).catch((e) =>
      console.error('Error sending task update email:', e)
    );

    if (req.io) {
      req.io.emit('task_updated', formattedTask);
    }

    return res.status(200).json({
      status: 'success',
      task: formattedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const { id } = req.params as { id: string };

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id },
    });

    // Invalidate Redis cache
    await cacheDel('workspace:tasks');

    if (req.io) {
      req.io.emit('task_deleted', id);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
