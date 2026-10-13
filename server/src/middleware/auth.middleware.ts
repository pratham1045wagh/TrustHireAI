import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'resume_ai_super_secret_jwt_key_2026_production_grade';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      role: UserRole;
      email: string;
    };

    // Authoritative role lookup from User model to prevent stale token or case mismatch issues
    const { User } = await import('../models/User');
    const userDoc = await User.findById(decoded.id).select('role email isActive');

    if (!userDoc || userDoc.isActive === false) {
      res.status(401).json({
        success: false,
        message: 'Account not found or has been deactivated.',
      });
      return;
    }

    const normalizedRole = String(userDoc.role || decoded.role || '').trim().toUpperCase() as UserRole;

    req.user = {
      id: userDoc._id.toString(),
      role: normalizedRole,
      email: userDoc.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

export const requireCandidate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const role = String(req.user?.role || '').trim().toUpperCase();
  if (role !== 'CANDIDATE' && role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Candidate privilege required.',
    });
    return;
  }
  next();
};

export const requireRecruiter = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const role = String(req.user?.role || '').trim().toUpperCase();
  if (role !== 'RECRUITER' && role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Recruiter privilege required.',
    });
    return;
  }
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const role = String(req.user?.role || '').trim().toUpperCase();
  if (role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privilege required.',
    });
    return;
  }
  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = String(req.user?.role || '').trim().toUpperCase();
    const normalizedRoles = roles.map((r) => String(r).trim().toUpperCase());
    if (!req.user || (!normalizedRoles.includes(userRole) && userRole !== 'ADMIN')) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
};
