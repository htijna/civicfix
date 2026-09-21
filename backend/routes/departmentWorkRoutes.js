import { Router } from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, allow('department_officer'));

function scopedOfficerAssignment(req, res) {
  if (!req.user.department || !req.user.localAuthority) {
    res.status(403).json({ message: 'Department account is not linked to a department and service area' });
    return null;
  }
  return {
    department: req.user.department,
    localAuthority: req.user.localAuthority,
    officer: req.user._id
  };
}

function departmentComplaintScope(assignment) {
  return {
    $or: [
      {
        department: assignment.department,
        localAuthority: assignment.localAuthority
      },
      { assignedTo: assignment.officer }
    ]
  };
}

router.get('/summary', async (req, res, next) => {
  try {
    const assignment = scopedOfficerAssignment(req, res);
    if (!assignment) return;
    const grouped = await Complaint.aggregate([
      {
        $match: {
          $or: [
            {
              department: new mongoose.Types.ObjectId(assignment.department),
              localAuthority: new mongoose.Types.ObjectId(assignment.localAuthority)
            },
            { assignedTo: new mongoose.Types.ObjectId(assignment.officer) }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ byStatus: Object.fromEntries(grouped.map(item => [item._id, item.count])) });
  } catch (error) { next(error); }
});

router.get('/complaints', async (req, res, next) => {
  try {
    const assignment = scopedOfficerAssignment(req, res);
    if (!assignment) return;
    const query = departmentComplaintScope(assignment);
    for (const key of ['status', 'category', 'priority', 'severity']) if (req.query[key]) query[key] = req.query[key];
    const complaints = await Complaint.find(query)
      .sort('-createdAt')
      .populate('createdBy', 'name email phone')
      .populate('department', 'name')
      .populate('localAuthority', 'name');
    res.json({ complaints });
  } catch (error) { next(error); }
});

router.get('/complaints/:id', async (req, res, next) => {
  try {
    const assignment = scopedOfficerAssignment(req, res);
    if (!assignment) return;
    const complaint = await Complaint.findOne({ _id: req.params.id, ...departmentComplaintScope(assignment) })
      .populate('createdBy', 'name email phone')
      .populate('department', 'name')
      .populate('localAuthority', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ complaint });
  } catch (error) { next(error); }
});

export default router;
