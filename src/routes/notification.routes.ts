import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router:Router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    const { title, message, userId } = req.body;

    // Check if user is admin or creating notification for themselves
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to create this notification' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        userId,
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating notification' });
  }
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken,asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user owns the notification
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating notification' });
  }
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user owns the notification or is admin
    if (notification.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting notification' });
  }
}));

export default router;