import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, allow('admin'));

router.get('/complaints.csv', async (_req, res, next) => {
  try {
    const complaints = await Complaint.find().sort('-createdAt').populate('createdBy', 'name email').lean();
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [['Reference', 'Title', 'Category', 'Status', 'Priority', 'Ward', 'Address', 'Citizen', 'Created']];
    for (const item of complaints) rows.push([item.reference, item.title, item.category, item.status, item.priority, item.location?.ward, item.location?.address, item.createdBy?.name, item.createdAt]);
    res.type('text/csv').attachment('civicfix-complaints.csv').send(rows.map(row => row.map(escape).join(',')).join('\n'));
  } catch (error) { next(error); }
});

export default router;
