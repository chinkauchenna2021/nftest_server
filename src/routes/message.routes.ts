import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router:Router = express.Router();
const prisma = new PrismaClient();

// Get all messages for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Create message to admin
router.post('/', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId: req.user.id,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating message' });
  }
}));

// Mark message as read (admin only)
router.patch('/:id/read', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating message' });
  }
}));

// Get all messages (admin only)
router.get('/all', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const messages = await prisma.message.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching all messages' });
  }
}));

export default router;