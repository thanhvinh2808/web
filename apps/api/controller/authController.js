import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/secrets.js';
import { createNotification } from './adminController.js';
import crypto from 'crypto'; // ✅ Secure Random

const JWT_SECRET = getJwtSecret();

// ✅ VALIDATION HELPER
const isValidString = (value) => typeof value === 'string' && value.trim().length > 0;

// ✅ REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Sanitize & Validate Inputs
    if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // 2. Check Exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // 3. Hash & Create
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: 'user'
    });

    // 🔔 Notify Admin
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
      expiresIn: 604800,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!isValidString(email) || !isValidString(password)) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    
    // Security Best Practice: Generic Error Message
    if (!user) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
    }

    // Double Check: Prevent Banned User Login (Redundant but safe)
    // Assuming we might add 'status' later, otherwise relying on existence is enough.

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Short lived access token
    );

    return res.json({
      success: true,
      token,
      expiresIn: 3600,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// ✅ LOGOUT
export const logout = async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
};

// ✅ GET USER PROFILE (ME)
export const getMe = async (req, res) => {
  try {
    // req.user is guaranteed to exist by auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      district: user.district,
      ward: user.ward,
      role: user.role,
      addresses: user.addresses,
      bankAccounts: user.bankAccounts,
      createdAt: user.createdAt,
      avatar: user.avatar
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { 
      name, phone, address, dateOfBirth, gender, 
      city, district, ward, avatar 
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name !== undefined) {
        if (!isValidString(name) || name.trim().length < 2) {
             return res.status(400).json({ success: false, message: 'Tên phải có ít nhất 2 ký tự' });
        }
        user.name = name.trim();
    }
    
    // Update other fields if provided
    if (phone !== undefined) user.phone = String(phone).trim();
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
      message: 'Cập nhật hồ sơ thành công',
      user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          district: user.district,
          ward: user.ward,
          avatar: user.avatar,
          role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!isValidString(currentPassword) || !isValidString(newPassword)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword.trim(), user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword.trim(), salt);
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidString(email)) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống' });

    // ✅ SECURE OTP GENERATION
    const token = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP
    user.resetPasswordToken = token; 
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Dev Log
    if (process.env.NODE_ENV !== 'production') {
        console.log(`
📧 [DEV ONLY] Secure OTP for ${email}: ${token}
`);
    }

    res.json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn (Check console nếu đang dev)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!isValidString(email) || !isValidString(otp) || !isValidString(newPassword)) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }

    if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { email, name, image, googleId } = req.body;

    if (!isValidString(email)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu Google không hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      // Create new user if not exists
      // Generate a random password since password is required in Schema
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name: name || 'Google User',
        email: trimmedEmail,
        password: hashedPassword,
        avatar: image || '',
        role: 'user'
      });

      // 🔔 Notify Admin
      try {
        if (typeof createNotification === 'function') {
          await createNotification('user', `Người dùng mới từ Google: ${user.name}`, user._id, 'User');
        }
      } catch (notiError) {
        console.error('⚠️ Notification error:', notiError);
      }
    } else {
      // Update avatar if it's empty
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
      expiresIn: 604800,
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
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};
