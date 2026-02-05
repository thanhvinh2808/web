import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/secrets.js';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập'
      });
    }

    jwt.verify(token, getJwtSecret(), (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }
      
     req.user = {
        userId: decoded.id,  // ✅ Thêm userId field
        id: decoded.id,      // ✅ Giữ lại id
        email: decoded.email,
        role: decoded.role
      }; // { id, email }
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực: ' + error.message
    });
  }
};