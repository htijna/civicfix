import { Router } from 'express';
import { body } from 'express-validator';
import Complaint from '../models/Complaint.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, allow } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { notify } from '../services/notificationService.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    for (const key of ['status', 'category', 'priority', 'department']) if (req.query[key]) query[key] = req.query[key];
    if (req.query.ward) query['location.ward'] = req.query.ward;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    }
    if (req.query.search) query.$text = { $search: req.query.search };
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const [data, count] = await Promise.all([
      Complaint.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit)
        .populate('createdBy', 'name avatar').populate('assignedTo', 'name').populate('department', 'name'),
      Complaint.countDocuments(query)
    ]);
    res.json({ count, page, pages: Math.ceil(count / limit), complaints: data });
  } catch (error) { next(error); }
});

router.post('/', [
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('description').trim().isLength({ min: 10, max: 3000 }),
  body('category').notEmpty(),
  body('location.address').trim().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const complaint = await Complaint.create({ ...req.body, createdBy: req.user.id });
    await Promise.all([
      notify(req.user.id, `Complaint ${complaint.reference} was submitted`, 'submitted', complaint.id),
      ActivityLog.create({ user: req.user.id, action: 'CREATE_COMPLAINT', entity: 'Complaint', entityId: complaint.id, ip: req.ip })
    ]);
    res.status(201).json({ complaint });
  } catch (error) { next(error); }
});

router.get('/admin/summary', allow('admin'), async (req, res, next) => {
  try {
    const [grouped, priorities, monthly, departments, total] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 }]),
      Complaint.aggregate([{ $group: { _id: '$department', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } }]),
      Complaint.countDocuments()
    ]);
    res.json({ total, byStatus: Object.fromEntries(grouped.map(x => [x._id, x.count])), byPriority: Object.fromEntries(priorities.map(x => [x._id, x.count])), monthly, departments });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Complaint.findById(req.params.id).populate('createdBy', 'name avatar').populate('assignedTo', 'name').populate('department', 'name');
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role !== 'admin' && !item.createdBy._id.equals(req.user.id)) return res.status(403).json({ message: 'Not allowed' });
    res.json({ complaint: item });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await Complaint.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role !== 'admin') {
      if (!item.createdBy.equals(req.user.id) || item.status !== 'Submitted') return res.status(403).json({ message: 'Only submitted complaints can be edited' });
      ['title', 'description', 'category', 'images', 'location', 'contactNumber', 'anonymous'].forEach(key => {
        if (req.body[key] !== undefined) item[key] = req.body[key];
      });
    } else {
      ['status', 'priority', 'assignedTo', 'department', 'completionImage'].forEach(key => {
        if (req.body[key] !== undefined) item[key] = req.body[key] || undefined;
      });
      if (req.body.remark) item.adminRemarks.push({ message: req.body.remark, by: req.user.id });
      if (req.body.status) item.timeline.push({ status: req.body.status, remark: req.body.remark, by: req.user.id });
    }
    await item.save();
    const type = item.status === 'Resolved' ? 'resolved' : req.body.remark ? 'remark' : 'updated';
    await Promise.all([
      notify(item.createdBy, `${item.reference}: ${req.body.remark || `status changed to ${item.status}`}`, type, item.id),
      ActivityLog.create({ user: req.user.id, action: 'UPDATE_COMPLAINT', entity: 'Complaint', entityId: item.id, details: req.body, ip: req.ip })
    ]);
    res.json({ complaint: item });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Complaint.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (item.status !== 'Submitted') return res.status(409).json({ message: 'Only submitted complaints can be deleted' });
    await item.deleteOne();
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
