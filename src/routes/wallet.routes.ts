import express, { type Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Get all wallets
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const wallets = await prisma.wallet.findMany();
    res.json(wallets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching wallets' });
  }
}));

// Get single wallet
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: req.params.id },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching wallet' });
  }
}));

// Create wallet (admin only)
router.post('/', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  try {
    const { usdtBtc20, usdtTrc20, usdtDefault } = req.body;

    if (!usdtBtc20 || !usdtTrc20) {
      return res.status(400).json({ error: 'USDT BTC20 and TRC20 addresses are required' });
    }

    // Only allow admins to create wallets
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to create wallets' });
    }

    const wallet = await prisma.wallet.create({
      data: {
        usdtBtc20,
        usdtTrc20,
        usdtDefault,
      },
    });

    res.status(201).json(wallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating wallet' });
  }
}));

// Update wallet (admin only)
router.put('/:id', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { usdtBtc20, usdtTrc20, usdtDefault } = req.body;

    const wallet = await prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this wallet' });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data: {
        usdtBtc20: usdtBtc20 || wallet.usdtBtc20,
        usdtTrc20: usdtTrc20 || wallet.usdtTrc20,
        usdtDefault: usdtDefault !== undefined ? usdtDefault : wallet.usdtDefault,
      },
    });

    res.json(updatedWallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating wallet' });
  }
}));

// Delete wallet (admin only)
router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const wallet = await prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this wallet' });
    }

    await prisma.wallet.delete({ where: { id } });
    res.json({ message: 'Wallet deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting wallet' });
  }
}));

export default router;