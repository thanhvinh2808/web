import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/secrets.js';
import { createNotification } from './adminController.js';
import crypto from 'crypto';

const JWT_SECRET = getJwtSecret();

const isValidString = (value) => typeof value === 'string' && value.trim().length > 0;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: 'user'
    });

    try {
      if (typeof createNotification === 'function') {
        await createNotification('user', `Người dùng mới: ${newUser.name}`, newUser._id, 'User');
      }
    } catch (notiError) {
      console.error('⚠️ Notification error:', notiError);
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!isValidString(email) || !isValidString(password)) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user || !user.password) { // Nếu user gg đăng nhập bằng pass thì chặn nếu họ chưa tạo pass
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác hoặc tài khoản chưa có mật khẩu' });
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const logout = async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth, gender, city, district, ward, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name.trim();
    
    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();
      if (cleanPhone !== '' && !/^\d{10,11}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại phải có từ 10 đến 11 chữ số' });
      }
      user.phone = cleanPhone;
    }
    if (address !== undefined) user.address = String(address).trim();
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (city !== undefined) user.city = String(city).trim();
    if (district !== undefined) user.district = String(district).trim();
    if (ward !== undefined) user.ward = String(ward).trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ 
      success: true, 
      message: 'Cập nhật thành công', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        city: user.city,
        district: user.district,
        ward: user.ward
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.password) return res.status(400).json({ success: false, message: 'Tài khoản không hỗ trợ đổi mật khẩu trực tiếp' });

    const isMatch = await bcrypt.compare(currentPassword.trim(), user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });

    user.password = await bcrypt.hash(newPassword.trim(), 10);
    await user.save();
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'Email không tồn tại' });

    const token = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordToken = token; 
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    console.log(`📧 OTP cho ${email}: ${token}`);
    res.json({ success: true, message: 'Mã OTP đã được gửi (Check console)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });

    user.password = await bcrypt.hash(newPassword.trim(), 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GOOGLE LOGIN FIX: Hỗ trợ tài khoản đã tồn tại
export const googleLogin = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ từ Google' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      // 1. Tạo user mới nếu chưa tồn tại
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name: name || 'Google User',
        email: trimmedEmail,
        password: hashedPassword, // Vẫn gán pass ngẫu nhiên để an toàn
        avatar: image || '',
        role: 'user'
      });

      if (typeof createNotification === 'function') {
        await createNotification('user', `Người dùng Google mới: ${user.name}`, user._id, 'User');
      }
    } else {
      // 2. Tài khoản đã tồn tại (Đăng ký qua form hoặc Google trước đó)
      // Cập nhật avatar nếu user chưa có
      if (!user.avatar && image) {
        user.avatar = image;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('❌ Google Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đồng bộ Google' });
  }
};
