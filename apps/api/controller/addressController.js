import Address from '../models/Address.js';
import User from '../models/User.js';

// Lấy danh sách địa chỉ của User
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error('❌ getAddresses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm địa chỉ mới
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, city, district, ward, address, isDefault, type } = req.body;

    // Nếu đây là địa chỉ đầu tiên, auto set default
    const count = await Address.countDocuments({ userId });
    const isFirst = count === 0;

    const newAddress = new Address({
      userId,
      name,
      phone,
      city,
      district: district || '',
      ward,
      specificAddress: address,
      isDefault: isFirst || isDefault,
      type: type || 'Home'
    });

    await newAddress.save();
    
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(201).json({ success: true, message: 'Thêm địa chỉ thành công', addresses });
  } catch (error) {
    console.error('❌ addAddress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật địa chỉ
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    Object.assign(address, updateData);
    await address.save();

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Cập nhật thành công', addresses });
  } catch (error) {
    console.error('❌ updateAddress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa địa chỉ
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const address = await Address.findOneAndDelete({ _id: id, userId });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    if (address.isDefault) {
      const latest = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Đã xóa địa chỉ', addresses });
  } catch (error) {
    console.error('❌ deleteAddress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set mặc định
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const address = await Address.findOne({ _id: id, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
    }

    address.isDefault = true;
    await address.save();

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'Đã đặt làm mặc định', addresses });
  } catch (error) {
    console.error('❌ setDefaultAddress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
