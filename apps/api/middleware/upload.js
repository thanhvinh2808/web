// backend/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars specifically if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

// ===== CONFIG CLOUDINARY =====
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️  Cloudinary Configured');
} else {
  console.log('📂 Cloudinary NOT configured. Using Local Storage.');
}

// ✅ MIME TYPE MAPPING (SECURITY FIX)
// Map MimeType to safe extensions
const MIME_TYPE_MAP = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

// ===== CẤU HÌNH STORAGE (HYBRID) =====
let storage;

if (isCloudinaryConfigured) {
  // --- Cloudinary Storage ---
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'footmark-products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      format: async (req, file) => {
        // Force format based on mimetype check implicit in allowed_formats
        // Cloudinary handles this well, but we can be explicit
        if (file.mimetype === 'image/png') return 'png';
        if (file.mimetype === 'image/webp') return 'webp';
        if (file.mimetype === 'image/gif') return 'gif';
        return 'jpg'; 
      },
    },
  });
} else {
  // --- Local Disk Storage (Fallback) ---
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/products';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 🛡️ SECURITY FIX: Ignore user's extension, use safe extension from Map
      const ext = MIME_TYPE_MAP[file.mimetype] || '.jpg';
      
      // Sanitize filename
      const originalName = path.basename(file.originalname, path.extname(file.originalname));
      const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
        
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    }
  });
}

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  const allowed = Object.keys(MIME_TYPE_MAP);
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP, GIF). File ${file.originalname} không hợp lệ.`), false);
  }
};

// ===== MULTER CONFIG =====
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  }
});

// ===== MIDDLEWARE EXPORTS =====
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// ===== ERROR HANDLER =====
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File quá lớn (Max 5MB).' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'Quá nhiều file (Max 10).' });
    return res.status(400).json({ success: false, message: 'Lỗi upload: ' + err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// ===== HELPER FUNCTIONS =====

const getCloudinaryPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filenameWithExt = parts.pop();
    const folder = parts.pop(); 
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
    return publicId;
  } catch (e) {
    return null;
  }
};

export const deleteFile = async (filePath) => {
  try {
    if (!filePath) return false;

    if (filePath.startsWith('http')) {
      if (!isCloudinaryConfigured) return false;
      const publicId = getCloudinaryPublicId(filePath);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log('☁️ Deleted from Cloudinary:', publicId);
        return true;
      }
      return false;
    } else {
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.resolve(process.cwd(), cleanPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('✅ Deleted local file:', fullPath);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

export const deleteMultipleFiles = async (filePaths) => {
  let success = 0;
  let failed = 0;
  await Promise.all(filePaths.map(async (path) => {
    const result = await deleteFile(path);
    if (result) success++; else failed++;
  }));
  return { success, failed };
};

export default {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile
};