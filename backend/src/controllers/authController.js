import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { SecurityLog } from '../models/SecurityLog.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
const NODE_ENV = process.env.NODE_ENV || 'development';

export const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email address already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER', // Can optionally sign up as ADMIN in local dev for testing
      },
    });

    // Send simulated welcome email (asynchronous, don't block user)
    sendWelcomeEmail(user).catch((e) => console.error('Error in sendWelcomeEmail background action:', e));

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

export const login = async (req, res, next) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Security audit log for authentication failures (Day 47-48 requirement)
      await SecurityLog.create({
        eventType: 'AUTH_FAILURE',
        ip: ipAddress,
        details: `Failed login attempt for email: ${email}`,
      });

      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log successful auth for audit
    await SecurityLog.create({
      eventType: 'AUTH_SUCCESS',
      ip: ipAddress,
      details: `Successful login for email: ${email}`,
      userId: user.id,
    });

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

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

export const triggerTestEmail = async (req, res, next) => {
  try {
    await sendWelcomeEmail(req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Test email successfully dispatched via SMTP/Nodemailer! Check backend logs for receipt.',
    });
  } catch (error) {
    next(error);
  }
};
