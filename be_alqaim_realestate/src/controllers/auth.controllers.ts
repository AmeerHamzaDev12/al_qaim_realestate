import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../Prisma";
import logger from "../logger";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const registerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required").email("Invalid email format"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one capital letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Password must contain at least one special character",
    ),
});

export const registerUser = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Invalid registration data");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = parsed.data;
  try {
    const existingUser = await prisma.userAdmin.findUnique({
      where: { email },
    });
    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return res
        .status(409)
        .json({ success: false, message: "User already exists", data: null });
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    const newUser = await prisma.userAdmin.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "1d" });
    await prisma.userAdmin.update({
      where: { id: newUser.id },
      data: { authtoken: token },
    });

    logger.info(`User registered: ${email}`);
    return res
      .status(200)
      .json({
        success: true,
        message: "User registered successfully",
        data: { token },
      });
  } catch (e: any) {
    logger.error(`Registration failed for ${email}: ${e.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: "Registration failed",
        data: { error: e.message },
      });
  }
};

const loginSchema = z.object({
  email: z.string().nonempty("Email is required").email("Invalid email format"),
  password: z.string().nonempty("Password is required"),
});

export const loginUser = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Invalid login data");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parsed.data;
  try {
    const user = await prisma.userAdmin.findUnique({ where: { email } });
    if (!user) {
      logger.info(`User not found: ${email}`);
      return res
        .status(404)
        .json({ success: false, message: "User not found", data: null });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.info(`Invalid password for user: ${email}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials", data: null });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    await prisma.userAdmin.update({
      where: { id: user.id },
      data: { authtoken: token },
    });

    logger.info(`User logged in: ${email}`);
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        token
      }
    });
  } catch (e: any) {
    logger.error(`Login failed for ${email}: ${e.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: "Login failed",
        data: { error: e.message },
      });
  }
};

export const CurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    const user = await prisma.userAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error(`Get me error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
};
