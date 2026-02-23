// ✅ isAdmin.js
// Middleware này phải được dùng SAU authenticateToken
// vì req.user đã được gán sẵn role từ DB trong authenticateToken

export const isAdmin = (req, res, next) => {
  // req.user đã được verify từ authenticateToken (có zombie check)
  // Không cần query DB lần 2, chỉ cần kiểm tra role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập',
    });
  }

  next();
};