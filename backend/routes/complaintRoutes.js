import { Router } from 'express';
import { body } from 'express-validator';
import Complaint from '../models/Complaint.js';
import ActivityLog from '../models/ActivityLog.js';
import { protect, allow } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { notify } from '../services/notificationService.js';
import { routeComplaint } from '../services/aiRoutingService.js';

const router = Router();
router.use(protect);

function idsEqual(left, right) {
  return left?._id?.equals(right) || left?.equals?.(right) || String(left) === String(right);
}

function canAccessDepartmentComplaint(item, user) {
  const directAssignment = idsEqual(item.assignedTo, user._id);
  const departmentScope = user.department
    && user.localAuthority
    && idsEqual(item.department, user.department)
    && idsEqual(item.localAuthority, user.localAuthority);
  return directAssignment || departmentScope;
}

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'department_officer' && (!req.user.department || !req.user.localAuthority)) return res.status(403).json({ message: 'Department account is not linked to a department or local authority' });
    const query = req.user.role === 'admin'
      ? {}
      : req.user.role === 'department_officer'
        ? { department: req.user.department, localAuthority: req.user.localAuthority }
        : { createdBy: req.user.id };
    const filterKeys = req.user.role === 'department_officer'
      ? ['status', 'category', 'priority', 'severity']
      : ['status', 'category', 'priority', 'severity', 'department', 'localAuthority', 'routingStatus'];
    for (const key of filterKeys) if (req.query[key]) query[key] = req.query[key];
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
        .populate('createdBy', 'name email phone avatar').populate('assignedTo', 'name').populate('department', 'name').populate('localAuthority', 'name'),
      Complaint.countDocuments(query)
    ]);
    res.json({ count, page, pages: Math.ceil(count / limit), complaints: data });
  } catch (error) { next(error); }
});

router.post('/', [
  body('location.address').trim().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const complaintData = { ...req.body, createdBy: req.user.id };
    if (complaintData.location && complaintData.location.longitude && complaintData.location.latitude) {
      complaintData.location.longitude = Number(complaintData.location.longitude);
      complaintData.location.latitude = Number(complaintData.location.latitude);
      complaintData.location.type = 'Point';
      complaintData.location.coordinates = [complaintData.location.longitude, complaintData.location.latitude];
    }
    const complaint = new Complaint(complaintData);
    const routedComplaint = await routeComplaint(complaint);
    await Promise.all([
      notify(req.user.id, `Complaint ${routedComplaint.reference} was submitted`, 'submitted', routedComplaint.id),
      ActivityLog.create({ user: req.user.id, action: 'CREATE_COMPLAINT', entity: 'Complaint', entityId: complaint.id, ip: req.ip })
    ]);
    res.status(201).json({ complaint: routedComplaint });
  } catch (error) { next(error); }
});

router.get('/admin/summary', allow('admin'), async (req, res, next) => {
  try {
    const [grouped, priorities, severities, aiDepartments, monthly, departments, total, aiAnalyzed] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: { 'aiAnalysis.department': { $exists: true, $ne: '' } } }, { $group: { _id: '$aiAnalysis.department', count: { $sum: 1 }, averageConfidence: { $avg: '$aiConfidence' } } }]),
      Complaint.aggregate([{ $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 }]),
      Complaint.aggregate([{ $group: { _id: '$department', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } }]),
      Complaint.countDocuments(),
      Complaint.countDocuments({ aiConfidence: { $ne: null } })
    ]);
    const aiConfidenceAverage = aiDepartments.length
      ? Number((aiDepartments.reduce((sum, item) => sum + (item.averageConfidence || 0), 0) / aiDepartments.length).toFixed(2))
      : 0;
    res.json({
      total,
      aiAnalyzed,
      aiConfidenceAverage,
      byStatus: Object.fromEntries(grouped.map(x => [x._id, x.count])),
      byPriority: Object.fromEntries(priorities.map(x => [x._id, x.count])),
      bySeverity: Object.fromEntries(severities.map(x => [x._id, x.count])),
      aiDepartments,
      monthly,
      departments
    });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Complaint.findById(req.params.id).populate('createdBy', 'name email phone avatar').populate('assignedTo', 'name').populate('department', 'name').populate('localAuthority', 'name');
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'department_officer' && !canAccessDepartmentComplaint(item, req.user)) return res.status(403).json({ message: 'Not allowed' });
    if (req.user.role !== 'admin' && req.user.role !== 'department_officer' && !item.createdBy._id.equals(req.user.id)) return res.status(403).json({ message: 'Not allowed' });
    res.json({ complaint: item });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await Complaint.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'department_officer') {
      if (!canAccessDepartmentComplaint(item, req.user)) return res.status(403).json({ message: 'Not allowed' });
      const allowedStatuses = ['Accepted', 'In Progress', 'Resolution Submitted', 'Resolved'];
      if (req.body.status && !allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid department status' });
      if (req.body.status) {
        item.status = req.body.status;
        if (req.body.status === 'Accepted') item.acceptedAt = new Date();
        if (req.body.status === 'In Progress') item.startedAt = new Date();
        if (req.body.status === 'Resolution Submitted') item.resolutionSubmittedAt = new Date();
        if (req.body.status === 'Resolved') item.resolvedAt = new Date();
        item.timeline.push({ status: req.body.status, remark: req.body.remark || req.body.resolutionDescription, by: req.user.id });
      }
      if (req.body.remark) item.departmentRemarks.push({ message: req.body.remark, by: req.user.id, images: req.body.images || [] });
      ['resolutionDescription', 'beforeImage', 'afterImage', 'completionImage'].forEach(key => {
        if (req.body[key] !== undefined) item[key] = req.body[key] || undefined;
      });
    } else if (req.user.role !== 'admin') {
      if (!item.createdBy.equals(req.user.id) || item.status !== 'Submitted') return res.status(403).json({ message: 'Only submitted complaints can be edited' });
      ['title', 'description', 'category', 'images', 'location', 'contactNumber', 'anonymous'].forEach(key => {
        if (req.body[key] !== undefined) item[key] = req.body[key];
      });
    } else {
      ['status', 'priority', 'severity', 'routingStatus', 'department', 'assignedTo', 'completionImage'].forEach(key => {
        if (req.body[key] !== undefined) item[key] = req.body[key] || undefined;
      });
      if (req.body.remark) item.adminRemarks.push({ message: req.body.remark, by: req.user.id });
      if (req.body.status) item.timeline.push({ status: req.body.status, remark: req.body.remark, by: req.user.id });
    }
    await item.save();
    const type = item.status === 'Resolved' ? 'resolved' : item.status === 'Resolution Submitted' ? 'resolution' : item.status === 'Accepted' ? 'accepted' : req.body.remark ? 'remark' : 'updated';
    await Promise.all([
      notify(item.createdBy, `${item.reference}: ${req.body.remark || `status changed to ${item.status}`}`, type, item.id),
      ActivityLog.create({ user: req.user.id, action: 'UPDATE_COMPLAINT', entity: 'Complaint', entityId: item.id, details: req.body, ip: req.ip })
    ]);
    res.json({ complaint: item });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user.id };
    const item = await Complaint.findOne(query);
    if (!item) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role !== 'admin' && item.status !== 'Submitted') return res.status(409).json({ message: 'Only submitted complaints can be deleted' });
    await item.deleteOne();
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
