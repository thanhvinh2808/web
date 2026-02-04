import Address from '../models/Address.js';
import User from '../models/User.js';

// Lấy danh sách địa chỉ của User
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm địa chỉ mới
export const addAddress = async (req, res) => {
  try {
    const { name, phone, city, district, ward, specificAddress, isDefault, type } = req.body;

    // Nếu đây là địa chỉ đầu tiên, auto set default
    const count = await Address.countDocuments({ userId: req.user.userId });
    const isFirst = count === 0;

    const newAddress = new Address({
      userId: req.user.userId,
      name,
      phone,
      city,
      district,
      ward,
      specificAddress,
      isDefault: isFirst || isDefault,
      type
    });

    await newAddress.save();
    
    // Trả về danh sách mới nhất để frontend cập nhật luôn
    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(201).json({ success: true, message: 'Thêm địa chỉ thành công', addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật địa chỉ
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const address = await Address.findOne({ _id: id, userId: req.user.userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    // Nếu set default = true, middleware trong Model sẽ lo việc bỏ default các cái khác
    Object.assign(address, updateData);
    await address.save();

    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Cập nhật thành công', addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa địa chỉ
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await Address.findOneAndDelete({ _id: id, userId: req.user.userId });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    // Nếu xóa địa chỉ mặc định, set cái mới nhất làm mặc định
    if (address.isDefault) {
      const latest = await Address.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Đã xóa địa chỉ', addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set mặc định
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await Address.findOne({ _id: id, userId: req.user.userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    address.isDefault = true;
    await address.save(); // Middleware sẽ chạy để bỏ default cũ

    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Đã đặt làm mặc định', addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
