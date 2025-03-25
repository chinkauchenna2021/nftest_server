import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';
import { asyncMiddleware } from '../utils/asyncHandler';
import prisma from '../services/prisma.service';
import { Role } from '@prisma/client';

// const prisma = new PrismaClient();

interface UserPayload {
   id: string; 
   email?: string | null; 
   password?: string | null; 
   walletAddress?: string | null; 
   role: Role; 
   createdAt?: Date; 
   updatedAt?: Date; 
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const generateToken = (user: { id: string; role: string }) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};






export const authenticateToken = asyncMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }
);