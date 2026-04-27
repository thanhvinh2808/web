// ✅ isAdmin.js
// Middleware này phải được dùng SAU authenticateToken
// vì req.user đã được gán sẵn role từ DB trong authenticateToken

export const isAdmin = (req, res, next) => {
  // Log để debug khi gặp lỗi 403
  console.log(`🔐 Admin Check - User: ${req.user?.email}, Role: [${req.user?.role}]`);

  if (!req.user || !req.user.role) {
    return res.status(403).json({
      success: false,
      message: 'Không tìm thấy thông tin quyền hạn',
    });
  }

  // Kiểm tra role không phân biệt hoa thường và loại bỏ khoảng trắng
  const userRole = req.user.role.toLowerCase().trim();
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền truy cập. Quyền hiện tại: ${req.user.role}`,
    });
  }

  next();
};