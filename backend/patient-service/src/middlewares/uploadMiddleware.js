import multer from 'multer';
import path from 'path';

// Simple disk storage — no Cloudinary dependency
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    // Use field name as prefix so proof files are distinguishable from EMR files
    const prefix = file.fieldname === 'proof' ? 'proof' : 'emr';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for receipts
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Only images (jpg, png, webp) and PDF files are allowed'));
  }
});

export default upload;
