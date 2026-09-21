import express from 'express';
import {
  getLocalAuthorities,
  getLocalAuthorityById,
  createLocalAuthority,
  updateLocalAuthority,
  deleteLocalAuthority
} from '../controllers/localAuthorityController.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getLocalAuthorities)
  .post(protect, allow('admin'), createLocalAuthority);

router.route('/:id')
  .get(protect, allow('admin'), getLocalAuthorityById)
  .put(protect, allow('admin'), updateLocalAuthority)
  .delete(protect, allow('admin'), deleteLocalAuthority);

export default router;
