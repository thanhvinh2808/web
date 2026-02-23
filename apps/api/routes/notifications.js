import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// ✅ FIX: '/read-all' phải đặt TRƯỚC '/:id/read'
// Nếu không, Express sẽ match '/read-all' vào route '/:id/read' với id = "read-all"
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'Đã đọc tất cả thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy danh sách thông báo của user
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      user_id: req.user.id,
      isRead: false,
    });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;