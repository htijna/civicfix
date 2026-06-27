import { Router } from 'express';
import Department from '../models/Department.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', async (_req, res, next) => {
  try { res.json({ departments: await Department.find({ active: true }).sort('name') }); }
  catch (error) { next(error); }
});
router.post('/', allow('admin'), async (req, res, next) => {
  try { res.status(201).json({ department: await Department.create(req.body) }); }
  catch (error) { next(error); }
});
router.put('/:id', allow('admin'), async (req, res, next) => {
  try { res.json({ department: await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }) }); }
  catch (error) { next(error); }
});
export default router;
