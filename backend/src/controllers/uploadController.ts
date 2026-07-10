import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';

export const uploadAvatarController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded or file type not allowed.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: fileUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      avatarUrl: fileUrl,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachmentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded or file type not allowed.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};
