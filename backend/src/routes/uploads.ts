import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer for local file storage
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload single image
router.post('/image', authenticate, upload.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // In production, you'd upload to S3 and return the S3 URL
  // For now, return local path
  const url = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url,
      filename: req.file.filename,
      size: req.file.size,
    },
  });
}));

// Upload multiple images
router.post('/images', authenticate, upload.array('images', 5), asyncHandler(async (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploads = files.map(file => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    size: file.size,
  }));

  res.json({
    success: true,
    data: uploads,
  });
}));

// Delete image (optional - for cleanup)
router.delete('/:filename', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({
    success: true,
    message: 'File deleted',
  });
}));

export default router;
