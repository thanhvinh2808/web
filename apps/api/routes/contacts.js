import express from 'express';
import Contact from '../models/Contact.js';
import { createAdminNotification } from '../utils/helpers.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, userId } = req.body;

    const newContact = new Contact({
      name, email, phone, subject, message,
      user_id: userId || null
    });

    await newContact.save();

    // ✅ Tạo thông báo cho Admin
    await createAdminNotification({
      type: 'contact',
      title: 'Tin nhắn liên hệ mới',
      message: `Khách hàng ${name} đã gửi một lời nhắn: "${message.substring(0, 50)}..."`,
      referenceId: newContact._id,
      referenceModel: 'Contact',
      userId: userId || null
    });

    res.json({ 
      success: true, 
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
