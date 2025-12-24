// backend/routes/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'vinh-super-secret-key-2024-techstore-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vinh-refresh-secret-key-2024';

// Lưu refresh tokens (trong production nên dùng Redis hoặc Database)
const refreshTokens = new Set();

// ✅ LOGIN - Tạo cả access token và refresh token
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email không tồn tại' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu không đúng' 
      });
    }
    
    // Tạo access token (10 phút)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '10m' }
    );
    
    // Tạo refresh token (7 ngày)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Lưu refresh token
    refreshTokens.add(refreshToken);
    
    return res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 600, // 10 phút = 600 giây
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
});

// ✅ REFRESH TOKEN - Làm mới access token
app.post('/api/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy refresh token'
      });
    }
    
    // Kiểm tra refresh token có trong danh sách không
    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }
    
    // Verify refresh token
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        refreshTokens.delete(refreshToken);
        return res.status(403).json({
          success: false,
          message: 'Refresh token đã hết hạn'
        });
      }
      
      // Tạo access token mới
      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '10m' }
      );
      
      return res.json({
        success: true,
        token: newAccessToken,
        expiresIn: 600
      });
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// ✅ LOGOUT - Xóa refresh token
app.post('/api/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    
    return res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// ✅ VERIFY TOKEN - Kiểm tra token còn hợp lệ không
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

export { authenticateToken };