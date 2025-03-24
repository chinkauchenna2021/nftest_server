import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';

const router:Router = express.Router();
const prisma = new PrismaClient();

const upload = multer({ dest: 'uploads/' });

// Get user profile
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
        profile: true,
        nfts: {
          include: {
            collections: true,
            sales: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user' });
  }
}));

// Update user profile (authenticated user only)
router.put('/:id', authenticateToken, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;
    const { bio } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Check if user is updating their own profile
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    // Update or create profile
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile;
    if (user.profile) {
      profile = await prisma.profile.update({
        where: { userId: id },
        data: {
          bio: bio || user.profile.bio,
          avatar: files.avatar?.[0]?.path || user.profile.avatar,
          banner: files.banner?.[0]?.path || user.profile.banner,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          bio,
          avatar: files.avatar?.[0]?.path || '',
          banner: files.banner?.[0]?.path || '',
          userId: id,
        },
      });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
}));

// Get user's NFTs
router.get('/:id/nfts', async (req, res) => {
  try {
    const nfts = await prisma.nFT.findMany({
      where: { creatorId: req.params.id },
      include: {
        collections: true,
        sales: true,
      },
    });
    res.json(nfts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user NFTs' });
  }
});

// Get user's purchased NFTs
router.get('/:id/purchases', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    // Check if user is accessing their own purchases
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view these purchases' });
    }

    const purchases = await prisma.sale.findMany({
      where: { buyerId: req.params.id },
      include: {
        nft: {
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                walletAddress: true,
                profile: true,
              },
            },
            collections: true,
          },
        },
      },
    });
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching purchases' });
  }
}));

export default router;