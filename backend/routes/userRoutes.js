import { Router } from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/assignees', allow('admin'), async (_req, res, next) => {
  try { res.json({ users: await User.find({ role: 'admin' }).select('name email ward').sort('name') }); }
  catch (error) { next(error); }
});
router.get('/activity', allow('admin'), async (_req, res, next) => {
  try { res.json({ activity: await ActivityLog.find().sort('-createdAt').limit(100).populate('user', 'name email') }); }
  catch (error) { next(error); }
});
export default router;
