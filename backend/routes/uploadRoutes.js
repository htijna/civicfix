import { Router } from 'express';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', 'uploads');
const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, or WEBP images are allowed');
      error.status = 422;
      return callback(error);
    }
    callback(null, true);
  }
});

// Support CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
if (process.env.CLOUDINARY_URL) {
  try {
    const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
    const cloudName = cloudinaryUrl.hostname;
    const apiKey = cloudinaryUrl.username;
    const apiSecret = cloudinaryUrl.password;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  } catch (e) {
    console.warn('Invalid CLOUDINARY_URL, falling back to individual env vars');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

function uploadOne(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'civicfix/complaints', resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    stream.end(file.buffer);
  });
}

function cloudinaryIsConfigured() {
  return Boolean(process.env.CLOUDINARY_URL || (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ));
}

async function saveOneLocally(req, file) {
  const filename = `${Date.now()}-${randomUUID()}${allowedTypes.get(file.mimetype)}`;
  await writeFile(path.join(uploadDir, filename), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

function handleUpload(req, res, next) {
  upload.array('images', 5)(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
      if (error.code === 'LIMIT_FILE_SIZE') error.message = 'Each image must be 5 MB or smaller';
      if (error.code === 'LIMIT_FILE_COUNT') error.message = 'Upload a maximum of five images';
    }
    next(error);
  });
}

router.post('/', protect, handleUpload, async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: 'Select at least one image' });
    let urls;
    if (cloudinaryIsConfigured()) {
      try {
        urls = await Promise.all(req.files.map(uploadOne));
      } catch (error) {
        console.warn(`Cloudinary upload failed, saving locally instead (${error.message})`);
      }
    }
    if (!urls) urls = await Promise.all(req.files.map(file => saveOneLocally(req, file)));
    res.status(201).json({ urls });
  } catch (error) { next(error); }
});

export default router;
