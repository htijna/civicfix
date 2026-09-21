import { Router } from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', allow('admin'), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    const users = await User.find(query).select('name email role active phone ward department localAuthority createdAt').populate('department', 'name').populate('localAuthority', 'name').sort('name');
    res.json({ users });
  } catch (error) { next(error); }
});
router.get('/assignees', allow('admin'), async (_req, res, next) => {
  try { res.json({ users: await User.find({ role: { $in: ['admin', 'department_officer'] } }).select('name email ward department localAuthority').populate('department', 'name').populate('localAuthority', 'name').sort('name') }); }
  catch (error) { next(error); }
});
router.get('/activity', allow('admin'), async (_req, res, next) => {
  try { res.json({ activity: await ActivityLog.find().sort('-createdAt').limit(100).populate('user', 'name email') }); }
  catch (error) { next(error); }
});
router.post('/', allow('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'citizen', department, localAuthority, phone, ward } = req.body;
    if (!['citizen', 'admin', 'department_officer'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (role === 'department_officer' && (!department || !localAuthority)) return res.status(400).json({ message: 'Department users must be linked to a department and local authority' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email is already registered' });
    const user = await User.create({ name, email, password, role, department: role === 'department_officer' ? department : undefined, localAuthority: role === 'department_officer' ? localAuthority : undefined, phone, ward });
    res.status(201).json({ user });
  } catch (error) { next(error); }
});
router.put('/:id', allow('admin'), async (req, res, next) => {
  try {
    const updates = {};
    ['name', 'phone', 'ward', 'department', 'localAuthority'].forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key] || undefined;
    });
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (req.body.role && ['citizen', 'admin', 'department_officer'].includes(req.body.role)) updates.role = req.body.role;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('name email role active phone ward department localAuthority').populate('department', 'name').populate('localAuthority', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) { next(error); }
});
router.delete('/:id', allow('admin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
