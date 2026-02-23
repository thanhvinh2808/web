// ✅ errorHandler.js
// Global error handling middleware cho Express
// Phải được đăng ký CUỐI CÙNG trong server.js: app.use(errorHandler)

export const errorHandler = (err, req, res, next) => {
  // Log error details (chỉ log đầy đủ ở dev)
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  } else {
    console.error('❌ Error:', err.message);
  }

  // Mặc định: 500 Internal Server Error
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Lỗi server nội bộ';

  // ---- Mongoose Errors ----

  // Validation Error (ví dụ: required field bị thiếu)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // Duplicate Key Error (ví dụ: email/slug bị trùng)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || '';
    message = `Giá trị "${value}" đã tồn tại cho trường "${field}"`;
  }

  // Cast Error (ví dụ: ID không hợp lệ)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Giá trị không hợp lệ cho trường: ${err.path}`;
  }

  // ---- JWT Errors ----
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn, vui lòng đăng nhập lại';
  }

  // ---- Multer Errors ----
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File quá lớn (tối đa 5MB)';
    else if (err.code === 'LIMIT_FILE_COUNT') message = 'Quá nhiều file (tối đa 10)';
    else message = 'Lỗi upload file: ' + err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    // Chỉ trả về stack trace ở môi trường dev
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// ✅ 404 Not Found handler — dùng trước errorHandler trong server.js
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
};