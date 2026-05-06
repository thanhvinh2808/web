import express from 'express';
import Contact from '../models/Contact.js';
import { createNotification } from '../controller/adminController.js';
import { sendNewContactEmail } from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/contacts
// @desc    Gửi tin nhắn liên hệ mới
router.post('/', async (req, res) => {
  try {
    const { name, fullname, email, phone, subject, message, userId } = req.body;

    // Linh hoạt giữa name và fullname để tránh lỗi từ Frontend
    const newContact = new Contact({
      fullname: fullname || name, 
      email, 
      phone, 
      subject, 
      message,
      user_id: userId || null
    });

    await newContact.save();

    // ✅ Tạo thông báo realtime cho Admin qua helper tập trung
    await createNotification(
      'contact', 
      `Khách hàng ${newContact.fullname} đã gửi tin nhắn: "${message.substring(0, 40)}..."`, 
      newContact._id, 
      'Contact'
    );

    // ✅ Gửi email thông báo cho Admin (Không đợi để tránh block UI)
    sendNewContactEmail(newContact).catch(err => console.error('❌ Email Alert Error:', err));

    res.json({ 
      success: true, 
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn và sẽ phản hồi sớm nhất qua email.' 
    });
  } catch (error) {
    console.error('❌ Contact Submit Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể gửi tin nhắn. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.' 
    });
  }
});

export default router;
