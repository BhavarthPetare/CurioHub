import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Room from '../models/Room.js';
import auth from '../middleware/auth.js';
import { normalizeEmail, EMAIL_RE } from '../utils/validate.js';

const router = express.Router();

// Brute-force protection for credential endpoints.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again later' }
});

const MAX_INTERESTS = 20;

const signToken = (user) =>
  jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests
});

router.post('/register', credentialLimiter, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!name || name.length > 50) {
    return res.status(400).json({ message: 'Name is required (max 50 characters)' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  // bcrypt only uses the first 72 bytes, so cap the length.
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'Password must be 8-72 characters' });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({ name, email, password: hashed });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'User already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', credentialLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid Credentials' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/interests', auth, async (req, res) => {
  const { interests } = req.body ?? {};

  if (!Array.isArray(interests) || interests.length > MAX_INTERESTS ||
      !interests.every((i) => typeof i === 'string')) {
    return res.status(400).json({ message: 'interests must be an array of room names' });
  }
  const unique = [...new Set(interests)];

  try {
    // Interests are room names; reject anything that isn't a real room.
    const known = await Room.countDocuments({ name: { $in: unique } });
    if (known !== unique.length) {
      return res.status(400).json({ message: 'Unknown interest' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { interests: unique },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(publicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    res.json(publicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
