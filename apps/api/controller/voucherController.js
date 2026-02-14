import Voucher from '../models/Voucher.js';

// 📋 Lấy danh sách Voucher (Có phân trang & tìm kiếm)
export const getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search ? {
      code: { $regex: search, $options: 'i' }
    } : {};

    const vouchers = await Voucher.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Voucher.countDocuments(query);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách voucher: ' + error.message
    });
  }
};

// ➕ Tạo Voucher mới
export const createVoucher = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      startDate,
      endDate,
      usageLimit
    } = req.body;

    // Validate cơ bản
    if (!code || !discountType || !discountValue || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Kiểm tra trùng code
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã tồn tại'
      });
    }

    const newVoucher = await Voucher.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      startDate: startDate || Date.now(),
      endDate,
      usageLimit,
      usedCount: 0,
      isActive: true
    });

    // 🔔 Create System Notifications for all users
    try {
      const User = (await import('../models/User.js')).default;
      const Notification = (await import('../models/Notification.js')).default;
      const users = await User.find({ role: 'user' }, '_id');
      
      const notifications = users.map(user => ({
        user_id: user._id,
        type: 'system',
        title: 'Voucher mới từ FootMark!',
        message: `Mã ${newVoucher.code} đã sẵn sàng: ${description || 'Ưu đãi cực khủng dành cho bạn'}. Sử dụng ngay!`,
        referenceId: newVoucher._id,
        referenceModel: 'Voucher' // Note: Ensure Voucher is added to enum in Notification.js if needed
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notiError) {
      console.error('⚠️ Error creating voucher notifications:', notiError);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo voucher thành công',
      data: newVoucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo voucher: ' + error.message
    });
  }
};

// ✏️ Cập nhật Voucher
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho sửa code để tránh lỗi logic
    if (updateData.code) delete updateData.code;

    const voucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật voucher thành công',
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật voucher: ' + error.message
    });
  }
};

// 🗑️ Xóa Voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    await Voucher.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Xóa voucher thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa voucher: ' + error.message
    });
  }
};
