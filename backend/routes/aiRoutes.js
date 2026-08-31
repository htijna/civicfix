import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { analyzeComplaint } from '../services/aiRoutingService.js';

const router = Router();
router.use(protect);

router.post('/suggest', async (req, res, next) => {
  try {
    const { images, location, title, description } = req.body;
    const analysis = await analyzeComplaint({
      title: title || '',
      description: description || '',
      images: images || [],
      location: location || {}
    });

    res.json({
      title: analysis.title || '',
      description: analysis.description || '',
      category: analysis.category || '',
      department: analysis.department || '',
      severity: analysis.severity || 'Medium',
      confidence: analysis.confidence || 0,
      aiReport: analysis.aiReport || ''
    });
  } catch (error) {
    next(error);
  }
});

export default router;
