import crypto from 'crypto';
import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { sendMail } from '../services/mailService.js';

const router = Router();
const token = id => jwt.sign({ id }, process.env.JWT_SECRET || 'development-secret-change-me', { expiresIn: '7d' });
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, ward: user.ward, avatar: user.avatar, language: user.language });

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  validate
], async (req, res, next) => {
  try {
    const { name, email, password, phone, ward } = req.body;
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email is already registered' });
    const user = await User.create({ name, email, password, phone, ward });
    await ActivityLog.create({ user: user.id, action: 'REGISTER', entity: 'User', entityId: user.id, ip: req.ip });
    res.status(201).json({ token: token(user.id), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !await user.verifyPassword(req.body.password)) return res.status(401).json({ message: 'Invalid email or password' });
    await ActivityLog.create({ user: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, ip: req.ip });
    res.json({ token: token(user.id), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/forgot-password', [body('email').isEmail().normalizeEmail(), validate], async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
      user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
      await user.save();
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${raw}`;
      await sendMail({ to: user.email, subject: 'CivicFix password reset', text: `Reset your password: ${resetUrl}` });
      if (process.env.NODE_ENV !== 'production') return res.json({ message: 'Reset link created', resetUrl });
    }
    res.json({ message: 'If that account exists, a reset link has been sent' });
  } catch (error) { next(error); }
});

router.post('/reset-password/:token', [body('password').isLength({ min: 8, max: 128 }), validate], async (req, res, next) => {
  try {
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hash, resetPasswordExpires: { $gt: Date.now() } }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) { next(error); }
});

router.get('/me', protect, async (req, res) => res.json({ user: publicUser(req.user) }));
router.put('/me', protect, async (req, res, next) => {
  try {
    ['name', 'phone', 'address', 'ward', 'avatar', 'language'].forEach(key => {
      if (req.body[key] !== undefined) req.user[key] = req.body[key];
    });
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) { next(error); }
});

export default router;
