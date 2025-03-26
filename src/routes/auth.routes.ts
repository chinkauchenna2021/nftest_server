
import express,  {type  Router,type  Request, type  Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { authenticateToken, generateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { generateServerNonce } from '../hook/generateNounce';

const router:Router = express.Router();
const prisma = new PrismaClient();

// Email/Password Signup
router.post('/signup', asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during signup' });
  }
}));

// Email/Password Login
router.post('/login',asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
}));

// Wallet Login/Signup
router.post('/wallet',asyncHandler(async (req, res) => {
  try {
    const { walletAddress, signature , nonce  } = req.body;
    const message = `Welcome to My DApp!\n\nSign this message to authenticate.\n\nNonce: ${nonce}`

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, and message are required' });
    }

    // Verify the signature
    const signer = ethers.verifyMessage(message, signature);
    if (signer.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          walletAddress,
          role: 'USER',
        },
      });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, walletAddress: user.walletAddress, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during wallet authentication' });
  }
}));

// Get current user
router.get('/me', authenticateToken,asyncHandler(async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
        profile: true,
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



// Get current nounce
router.get('/nonce', authenticateToken,asyncHandler(async (req: any, res) => {
  try {
    const nonce = generateServerNonce();
    const expiration = Date.now() + 15 * 60 * 1000; 
    res.json({ nonce, expiration});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching nonce' });
  }
}));

export default router;