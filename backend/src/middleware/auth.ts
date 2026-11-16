import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    throw AppError.unauthorized();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      name: string;
      role: Role;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  if (req.user.role !== Role.ADMIN) {
    throw AppError.forbidden('Admin access required');
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  next();
}
