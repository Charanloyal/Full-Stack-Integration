import prisma from '../db/prisma.js';
import { sendTaskNotification } from '../services/emailService.js';

export const getTasks = async (req, res, next) => {
  try {
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

    return res.status(200).json({
      status: 'success',
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, dueDate, attachmentUrl } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        attachmentUrl: attachmentUrl || null,
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

    // Notify user via Email (background task)
    sendTaskNotification(req.user, task, 'created').catch((e) =>
      console.error('Error sending task notification email:', e)
    );

    // Broadcast update via WebSockets
    if (req.io) {
      req.io.emit('task_created', task);
    }

    return res.status(201).json({
      status: 'success',
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, attachmentUrl } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    // Check if the user is authorized: admin can update any, regular users can update any tasks in this collaborative setup
    // For collaboration, anyone can edit tasks, which is standard, but we'll associate the editor with it if needed

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTask.dueDate,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existingTask.attachmentUrl,
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

    // Notify user via Email
    sendTaskNotification(req.user, updatedTask, `updated (status: ${updatedTask.status})`).catch((e) =>
      console.error('Error sending task update email:', e)
    );

    // Broadcast update via WebSockets
    if (req.io) {
      req.io.emit('task_updated', updatedTask);
    }

    return res.status(200).json({
      status: 'success',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id },
    });

    // Broadcast deletion via WebSockets
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
