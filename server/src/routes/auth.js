import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash').lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Missing authentication token.' });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findOne({ id: decoded.sub }).select('-passwordHash').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
