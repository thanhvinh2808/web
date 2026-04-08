// middleware/upload.js
import multer from 'multer';
import nodePath from 'path'; // ✅ FIX: Đổi tên import để tránh shadow với param 'filePath'
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: nodePath.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: nodePath.join(__dirname, '..', '.env'), override: false });

// ===== CONFIG CLOUDINARY =====
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary Configured');
} else {
  console.log('📂 Cloudinary NOT configured. Using Local Storage.');
}

// ===== MIME TYPE WHITELIST =====
const MIME_TYPE_MAP = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// ===== STORAGE =====
let storage;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'footmark-products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      format: async (req, file) => {
        if (file.mimetype === 'image/png') return 'png';
        if (file.mimetype === 'image/webp') return 'webp';
        if (file.mimetype === 'image/gif') return 'gif';
        return 'jpg';
      },
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/products';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 🛡️ SECURITY: Bỏ qua extension từ client, dùng extension từ MIME type
      const ext = MIME_TYPE_MAP[file.mimetype] || '.jpg';
      const originalName = nodePath.basename(file.originalname, nodePath.extname(file.originalname));
      const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    },
  });
}

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  if (Object.keys(MIME_TYPE_MAP).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP, GIF). File "${file.originalname}" không hợp lệ.`
      ),
      false
    );
  }
};

// ===== MULTER INSTANCE =====
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
});

// ===== MIDDLEWARE EXPORTS =====
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
export const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]);

// ===== UPLOAD ERROR HANDLER =====
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'File quá lớn (tối đa 5MB).' });
    if (err.code === 'LIMIT_FILE_COUNT')
      return res.status(400).json({ success: false, message: 'Quá nhiều file (tối đa 10).' });
    return res.status(400).json({ success: false, message: 'Lỗi upload: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// ===== HELPER: Lấy Cloudinary public_id từ URL =====
const getCloudinaryPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filenameWithExt = parts.pop();
    const folder = parts.pop();
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
    return publicId;
  } catch {
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
      const fullPath = nodePath.resolve(process.cwd(), cleanPath);
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

// ===== HELPER: Xóa nhiều file =====
export const deleteMultipleFiles = async (filePaths) => {
  const results = await Promise.allSettled(filePaths.map((filePath) => deleteFile(filePath)));
  const success = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;
  return { success, failed };
};

export default {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile,
};