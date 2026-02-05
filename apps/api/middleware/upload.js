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

// ===== CẤU HÌNH STORAGE (HYBRID) =====
let storage;

if (isCloudinaryConfigured) {
  // --- Cloudinary Storage ---
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'footmark-products', // Tên folder trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      // public_id: (req, file) => 'computed-filename-using-request',
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const safeName = nameWithoutExt
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    }
  });
}

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
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

/**
 * Get Public ID from Cloudinary URL
 * URL format: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg
 * Public ID: folder/filename (no extension)
 */
const getCloudinaryPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filenameWithExt = parts.pop();
    const folder = parts.pop(); // e.g., 'footmark-products'
    // const version = parts.pop(); // e.g., 'v123456'
    
    // Nếu URL không chứa folder đúng config, có thể logic này cần điều chỉnh tùy cấu trúc
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
    return publicId;
  } catch (e) {
    return null;
  }
};

/**
 * Xóa file (Local hoặc Cloudinary)
 */
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) return false;

    // Case 1: Cloudinary URL
    if (filePath.startsWith('http')) {
      if (!isCloudinaryConfigured) return false;
      
      const publicId = getCloudinaryPublicId(filePath);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log('☁️ Deleted from Cloudinary:', publicId);
        return true;
      }
      return false;
    } 
    // Case 2: Local Path (e.g., /uploads/products/...)
    else {
      // Remove leading slash if present
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
  // Use map to process async in parallel
  await Promise.all(filePaths.map(async (path) => {
    const result = await deleteFile(path);
    if (result) success++; else failed++;
  }));
  return { success, failed };
};

// Helper backward compatible (keep sync signature where possible, but delete is async now)
// Note: Code using deleteFile needs to await it now if consistency matters.

export default {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile
};
