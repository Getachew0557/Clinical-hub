import multer from 'multer';
import path from 'path';

// Simple disk storage — no Cloudinary dependency
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `appt-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop());
    if (ext) return cb(null, true);
    cb(new Error('Only images (jpg, png) and PDF files are allowed'));
  }
});

export default upload;
