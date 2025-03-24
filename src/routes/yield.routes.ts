import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';

const router:Router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/yield/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
});

// Get all yield options
router.get('/', async (req, res) => {
  try {
    const yields = await prisma.yield.findMany();
    res.json(yields);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching yield options' });
  }
});

// Create yield option (admin only)
router.post('/', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'imageLg', maxCount: 1 }]),asyncHandler( async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, amountRange, chartPercent, income, fee, level, days } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!title || !amountRange || !chartPercent || !income || !fee || !level || !days) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const yieldOption = await prisma.yield.create({
      data: {
        image: files.image?.[0]?.path || '',
        imageLg: files.imageLg?.[0]?.path || '',
        title,
        amountRange,
        chartPercent,
        income,
        fee,
        level,
        days,
      },
    });

    res.status(201).json(yieldOption);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating yield option' });
  }
}));

// Update yield option (admin only)
router.put('/:id', authenticateToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'imageLg', maxCount: 1 }]),asyncHandler(async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { title, amountRange, chartPercent, income, fee, level, days } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const existingYield = await prisma.yield.findUnique({ where: { id } });
    if (!existingYield) {
      return res.status(404).json({ error: 'Yield option not found' });
    }

    const updatedYield = await prisma.yield.update({
      where: { id },
      data: {
        image: files.image?.[0]?.path || existingYield.image,
        imageLg: files.imageLg?.[0]?.path || existingYield.imageLg,
        title: title || existingYield.title,
        amountRange: amountRange || existingYield.amountRange,
        chartPercent: chartPercent || existingYield.chartPercent,
        income: income || existingYield.income,
        fee: fee || existingYield.fee,
        level: level || existingYield.level,
        days: days || existingYield.days,
      },
    });

    res.json(updatedYield);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating yield option' });
  }
}));

// Delete yield option (admin only)
router.delete('/:id', authenticateToken,asyncHandler(async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    await prisma.yield.delete({ where: { id } });
    res.json({ message: 'Yield option deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting yield option' });
  }
}));

export default router;