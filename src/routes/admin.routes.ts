
import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, adminOnly } from '../middleware/auth.middleware';
import { asyncHandler, asyncMiddleware } from '../utils/asyncHandler';


const router:Router = express.Router();
const prisma = new PrismaClient();

// Apply adminOnly middleware to all routes in this file
router.use(authenticateToken as any, adminOnly as any);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Update user role
router.put('/users/:id/role', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating user role' });
  }
}));

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Get all NFTs
router.get('/nfts', async (req, res) => {
  try {
    const nfts = await prisma.nFT.findMany({
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
        collections: true,
        sales: true,
      },
    });
    res.json(nfts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching NFTs' });
  }
});

// Delete NFT (admin override)
router.delete('/nfts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.nFT.delete({ where: { id } });
    res.json({ message: 'NFT deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting NFT' });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalNfts = await prisma.nFT.count();
    const totalSales = await prisma.sale.count();
    const totalRevenue = await prisma.sale.aggregate({
      _sum: { price: true },
    });

    res.json({
      totalUsers,
      totalNfts,
      totalSales,
      totalRevenue: totalRevenue._sum.price || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

export default router;