// backend/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== CẤU HÌNH STORAGE =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    
    // Slug-ify tên file (remove special chars, spaces)
    const safeName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50); // Giới hạn độ dài
    
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file ảnh
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
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
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    files: 10 // Tối đa 10 files cùng lúc
  }
});

// ===== MIDDLEWARE EXPORTS =====

/**
 * Upload single image
 * Field name: 'image'
 */
export const uploadSingle = upload.single('image');

/**
 * Upload multiple images
 * Field name: 'images'
 * Max: 10 files
 */
export const uploadMultiple = upload.array('images', 10);

/**
 * Upload fields (có thể upload nhiều loại field khác nhau)
 * VD: thumbnail + gallery
 */
export const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// ===== ERROR HANDLER MIDDLEWARE =====
/**
 * Xử lý lỗi từ multer
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Lỗi từ multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 5MB.',
        error: err.message
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Vượt quá số lượng file cho phép (tối đa 10 files).',
        error: err.message
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Field name không đúng. Vui lòng sử dụng "image" hoặc "images".',
        error: err.message
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi upload file.',
      error: err.message
    });
  } else if (err) {
    // Lỗi custom từ fileFilter hoặc lỗi khác
    return res.status(400).json({
      success: false,
      message: err.message || 'Lỗi không xác định khi upload file.'
    });
  }
  
  // Không có lỗi, tiếp tục
  next();
};

// ===== HELPER FUNCTIONS =====

/**
 * Xóa file khỏi server
 * @param {string} filePath - Đường dẫn file cần xóa
 * @returns {boolean} - true nếu xóa thành công
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Deleted file:', filePath);
      return true;
    } else {
      console.log('⚠️ File not found:', filePath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

/**
 * Xóa nhiều file
 * @param {string[]} filePaths - Mảng đường dẫn files cần xóa
 * @returns {object} - { success: number, failed: number }
 */
export const deleteMultipleFiles = (filePaths) => {
  let success = 0;
  let failed = 0;
  
  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) {
      success++;
    } else {
      failed++;
    }
  });
  
  return { success, failed };
};

/**
 * Validate URL ảnh
 * @param {string} url - URL cần validate
 * @returns {boolean}
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Check nếu là URL local uploads
  if (url.startsWith('/uploads/')) return true;
  
  // Check nếu là URL external
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
};

/**
 * Get filename từ URL
 * @param {string} url - URL ảnh
 * @returns {string|null} - Filename hoặc null
 */
export const getFilenameFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Nếu là local URL
    if (url.startsWith('/uploads/')) {
      return url.split('/').pop();
    }
    
    // Nếu là external URL
    const urlObj = new URL(url);
    return path.basename(urlObj.pathname);
  } catch {
    return null;
  }
};

/**
 * Clean old uploads (xóa file cũ hơn X ngày)
 * @param {number} daysOld - Số ngày (default: 30)
 */
export const cleanOldUploads = (daysOld = 30) => {
  const uploadDir = 'uploads/products';
  const now = Date.now();
  const daysInMs = daysOld * 24 * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(uploadDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > daysInMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    console.log(`🧹 Cleaned ${deletedCount} old files from ${uploadDir}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning old uploads:', error);
    return 0;
  }
};

/**
 * Get upload statistics
 */
export const getUploadStats = () => {
  const uploadDir = 'uploads/products';
  
  try {
    const files = fs.readdirSync(uploadDir);
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      fileTypes: {}
    };
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const fileStats = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      
      stats.totalSize += fileStats.size;
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
    });
    
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting upload stats:', error);
    return null;
  }
};

// ===== DEFAULT EXPORT =====
export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  deleteFile,
  deleteMultipleFiles,
  isValidImageUrl,
  getFilenameFromUrl,
  cleanOldUploads,
  getUploadStats
};