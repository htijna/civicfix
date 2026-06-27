import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, callback) {
    callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function uploadOne(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'civicfix/complaints', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    stream.end(file.buffer);
  });
}

router.post('/', protect, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(503).json({ message: 'Image storage is not configured' });
    if (!req.files?.length) return res.status(400).json({ message: 'Select at least one image' });
    res.status(201).json({ urls: await Promise.all(req.files.map(uploadOne)) });
  } catch (error) { next(error); }
});

export default router;
