import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import prisma from '../db/prisma.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { SecurityLog } from '../models/SecurityLog.js';
import { saveLocalLog } from '../services/jsonDbService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
const NODE_ENV = process.env.NODE_ENV || 'development';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
      },
    });

    sendWelcomeEmail(user).catch((e) => console.error('Error in sendWelcomeEmail background action:', e));

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (mongoose.connection.readyState === 1) {
        await SecurityLog.create({
          eventType: 'AUTH_FAILURE',
          ip: ipAddress,
          details: `Failed login attempt for email: ${email}`,
        });
      } else {
        await saveLocalLog({
          eventType: 'AUTH_FAILURE',
          ip: ipAddress,
          details: `Failed login attempt for email: ${email}`,
        });
      }

      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (mongoose.connection.readyState === 1) {
      await SecurityLog.create({
        eventType: 'AUTH_SUCCESS',
        ip: ipAddress,
        details: `Successful login for email: ${email}`,
        userId: user.id,
      });
    } else {
      await saveLocalLog({
        eventType: 'AUTH_SUCCESS',
        ip: ipAddress,
        details: `Successful login for email: ${email}`,
        userId: user.id,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

export const triggerTestEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }
    await sendWelcomeEmail(req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Test email successfully dispatched via SMTP/Nodemailer! Check backend logs for receipt.',
    });
  } catch (error) {
    next(error);
  }
};
