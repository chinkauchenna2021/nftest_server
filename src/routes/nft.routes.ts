
import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';

const router:Router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Get all NFTs
router.get('/', async (req, res) => {
  try {
    const nfts = await prisma.nFT.findMany({
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
    });
    res.json(nfts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching NFTs' });
  }
});

// Get single NFT
router.get('/:id', asyncHandler(async (req:Request, res:Response) => {
  try {
    const nft = await prisma.nFT.findUnique({
      where: { id: req.params.id },
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
        sales: {
          include: {
            buyer: {
              select: {
                id: true,
                email: true,
                walletAddress: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json(nft);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching NFT' });
  }
}));

// Create NFT (authenticated users only)
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), asyncHandler(async (req: any, res) => {
  try {
    const { name, description, price } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const nft = await prisma.nFT.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image: files.image?.[0]?.path || '',
        logo: files.logo?.[0]?.path || '',
        creatorId: req.user.id,
      },
    });

    res.status(201).json(nft);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating NFT' });
  }
}));

// Update NFT (creator or admin only)
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]),asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const nft = await prisma.nFT.findUnique({ where: { id } });
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if user is creator or admin
    if (nft.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this NFT' });
    }

    const updatedNft = await prisma.nFT.update({
      where: { id },
      data: {
        name: name || nft.name,
        description: description || nft.description,
        price: price ? parseFloat(price) : nft.price,
        image: files.image?.[0]?.path || nft.image,
        logo: files.logo?.[0]?.path || nft.logo,
      },
    });

    res.json(updatedNft);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating NFT' });
  }
}));

// Delete NFT (creator or admin only)
router.delete('/:id', authenticateToken,asyncHandler( async (req: any, res) => {
  try {
    const { id } = req.params;

    const nft = await prisma.nFT.findUnique({ where: { id } });
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if user is creator or admin
    if (nft.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this NFT' });
    }

    await prisma.nFT.delete({ where: { id } });
    res.json({ message: 'NFT deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting NFT' });
  }
}));

// Add collection to NFT (creator only)
router.post('/:id/collections', authenticateToken, upload.single('image'),asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, price, resaleProfit, chartAmount, creatorContract, owner, chain, timezone, tokenId } = req.body;

    const nft = await prisma.nFT.findUnique({ where: { id } });
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if user is creator
    if (nft.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add collection to this NFT' });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        price: parseFloat(price),
        resaleProfit: parseFloat(resaleProfit),
        chartAmount: parseFloat(chartAmount),
        image: req.file?.path || '',
        creatorContract,
        owner,
        chain,
        timezone,
        tokenId,
        nftId: id,
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding collection' });
  }
}));

// Record NFT sale
router.post('/:id/sales', authenticateToken, asyncHandler(async (req: any, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    const nft = await prisma.nFT.findUnique({ where: { id } });
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    const sale = await prisma.sale.create({
      data: {
        nftId: id,
        buyerId: req.user.id,
        price: parseFloat(price),
      },
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error recording sale' });
  }
}));

// Get NFT sales stats
router.get('/:id/sales/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const sales = await prisma.sale.findMany({
      where: { nftId: id },
      orderBy: { soldAt: 'asc' },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum: any, sale: { price: any; }) => sum + sale.price, 0);
    const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    res.json({
      totalSales,
      totalRevenue,
      averagePrice,
      sales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching sales stats' });
  }
});

export default router;