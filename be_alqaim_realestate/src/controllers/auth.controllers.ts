import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../Prisma";
import logger from "../logger";
import nodemailer from "nodemailer";
import {z} from "zod";

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const registerSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z.string().nonempty('Email is required').email('Invalid email format'),
  password: z.string()
    .nonempty('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one capital letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
});

export const registerUser = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('Invalid registration data');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: parsed.error.flatten().fieldErrors
    });
  }

  const { name, email, password } = parsed.data;
  try {
    const existingUser = await prisma.userAdmin.findUnique({ where: { email } });
    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return res.status(409).json({ success: false, message: 'User already exists', data: null });
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    const newUser = await prisma.userAdmin.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });
    await prisma.userAdmin.update({ where: { id: newUser.id }, data: { authtoken: token } });

    logger.info(`User registered: ${email}`);
    return res.status(200).json({ success: true, message: 'User registered successfully', data: { token } });

  } catch (e: any) {
    logger.error(`Registration failed for ${email}: ${e.message}`);
    return res.status(500).json({ success: false, message: 'Registration failed', data: { error: e.message } });
  }
};