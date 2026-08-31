import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, allow('department'));

function scopedDepartmentId(req, res) {
  if (!req.user.department) {
    res.status(403).json({ message: 'Department account is not linked to a department' });
    return null;
  }
  return req.user.department;
}

router.get('/summary', async (req, res, next) => {
  try {
    const department = scopedDepartmentId(req, res);
    if (!department) return;
    const grouped = await Complaint.aggregate([
      { $match: { department } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ byStatus: Object.fromEntries(grouped.map(item => [item._id, item.count])) });
  } catch (error) { next(error); }
});

router.get('/complaints', async (req, res, next) => {
  try {
    const department = scopedDepartmentId(req, res);
    if (!department) return;
    const query = { department };
    for (const key of ['status', 'category', 'priority', 'severity']) if (req.query[key]) query[key] = req.query[key];
    const complaints = await Complaint.find(query)
      .sort('-createdAt')
      .populate('createdBy', 'name email phone')
      .populate('department', 'name');
    res.json({ complaints });
  } catch (error) { next(error); }
});

router.get('/complaints/:id', async (req, res, next) => {
  try {
    const department = scopedDepartmentId(req, res);
    if (!department) return;
    const complaint = await Complaint.findOne({ _id: req.params.id, department })
      .populate('createdBy', 'name email phone')
      .populate('department', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ complaint });
  } catch (error) { next(error); }
});

export default router;
