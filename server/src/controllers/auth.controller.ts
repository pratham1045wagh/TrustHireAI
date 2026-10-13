import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { AuthRequest } from '../types';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name must contain at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  role: z.enum(['CANDIDATE', 'RECRUITER'], {
    errorMap: () => ({ message: 'Role must be either CANDIDATE or RECRUITER' }),
  }),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      const { name, email, password, role, companyName } = validation.data;

      if (role === 'RECRUITER' && !companyName) {
        res.status(400).json({
          success: false,
          message: 'Company name is required for recruiter registration.',
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const normalizedRole = (role ? String(role).trim().toUpperCase() : 'CANDIDATE') as 'CANDIDATE' | 'RECRUITER';

      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
        companyName: normalizedRole === 'RECRUITER' ? companyName : undefined,
      });

      const token = AuthController.generateToken(user._id.toString(), user.role, user.email);
      AuthController.setCookieToken(res, token);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      const { email, password } = validation.data;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      const token = AuthController.generateToken(user._id.toString(), user.role, user.email);
      AuthController.setCookieToken(res, token);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  public static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private static generateToken(id: string, role: string, email: string): string {
    const secret = process.env.JWT_SECRET || 'resume_ai_super_secret_jwt_key_2026_production_grade';
    return jwt.sign({ id, role, email }, secret, { expiresIn: '7d' });
  }

  private static setCookieToken(res: Response, token: string): void {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
