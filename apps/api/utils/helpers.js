import Notification from '../models/Notification.js';

export function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Tạo thông báo cho Admin và phát qua Socket.io
 */
export async function createAdminNotification({ type, title, message, referenceId, referenceModel, userId }) {
  try {
    const notification = new Notification({
      type,
      title,
      message,
      referenceId,
      referenceModel,
      user_id: userId,
      isRead: false
    });

    await notification.save();

    // Phát sự kiện qua Socket.io (nếu global.io đã được khởi tạo)
    if (global.io) {
      global.io.to('admin').emit('newNotification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Create Notification Error:', error);
  }
}