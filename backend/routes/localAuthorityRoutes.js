import express from 'express';
import {
  getLocalAuthorities,
  getLocalAuthorityById
} from '../controllers/localAuthorityController.js';
import { protect, allow } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getLocalAuthorities);

router.route('/:id')
  .get(protect, allow('admin'), getLocalAuthorityById);

export default router;
