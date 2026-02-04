import SizeGuide from '../models/SizeGuide.js';

// Lấy Size Guide theo Brand và Gender
export const getSizeGuide = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { gender } = req.query; // ?gender=Men

    const query = { brandId };
    if (gender) query.gender = gender;

    const sizeGuide = await SizeGuide.findOne(query);
    
    if (!sizeGuide) {
      return res.status(404).json({ success: false, message: 'Size guide not found' });
    }

    res.status(200).json({ success: true, sizeGuide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin tạo/update Size Guide
export const upsertSizeGuide = async (req, res) => {
  try {
    const { brandId, gender, sizes, type, imageUrl } = req.body;

    // Tìm xem đã có chưa để update, nếu chưa thì tạo mới (Upsert)
    const sizeGuide = await SizeGuide.findOneAndUpdate(
      { brandId, gender },
      { sizes, type, imageUrl },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, sizeGuide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
