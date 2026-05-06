import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/secrets.js';
import User from '../models/User.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập'
    });
  }

  // Verify Token
  jwt.verify(token, getJwtSecret(), async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    try {
      // 🛡️ SECURITY CHECK: Zombie User & Locked Account
      // Kiểm tra xem User có thực sự tồn tại trong DB không và có bị khóa không
      const user = await User.findById(decoded.id).select('_id role email name isLocked');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không tồn tại hoặc đã bị xóa. Vui lòng đăng nhập lại.'
        });
      }

      if (user.isLocked) {
        return res.status(403).json({
          success: false,
          isLocked: true,
          message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ để được hỗ trợ.'
        });
      }

      // Attach user info to request
      req.user = {
        userId: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();
    } catch (dbError) {
      console.error('Auth Middleware Error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực người dùng.'
      });
    }
  });
};
