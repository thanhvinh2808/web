import SizeGuide from '../models/SizeGuide.js';
import Brand from '../models/Brand.js';

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

/**
 * 🦶 GỢI Ý SIZE GIÀY THÔNG MINH THEO SỐ ĐO BÀN CHÂN (cm)
 * GET /api/size-guides/suggest?footLengthCm=25.5&brand=Nike&gender=Men
 * 
 * Logic: Tìm size có số cm gần nhất với số đo bàn chân.
 * Áp dụng hệ số bù theo brand (Nike/Adidas thường cần tăng 0.5 size).
 */
export const suggestSize = async (req, res) => {
  try {
    const { footLengthCm, brand, gender = 'Men' } = req.query;

    if (!footLengthCm) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số đo bàn chân (cm)' });
    }

    const footCm = parseFloat(footLengthCm);
    if (isNaN(footCm) || footCm < 15 || footCm > 35) {
      return res.status(400).json({ success: false, message: 'Số đo bàn chân không hợp lệ (15cm - 35cm)' });
    }

    // Bảng size mặc định nếu không có size guide trong DB (chuẩn quốc tế)
    const UNIVERSAL_SIZE_TABLE = [
      { eu: 35, us: 4,   uk: 3,   cm: 22.0 },
      { eu: 36, us: 5,   uk: 4,   cm: 22.5 },
      { eu: 37, us: 5.5, uk: 4.5, cm: 23.0 },
      { eu: 38, us: 6,   uk: 5,   cm: 23.5 },
      { eu: 38.5, us: 6.5, uk: 5.5, cm: 24.0 },
      { eu: 39, us: 7,   uk: 6,   cm: 24.5 },
      { eu: 40, us: 7.5, uk: 6.5, cm: 25.0 },
      { eu: 40.5, us: 8, uk: 7,   cm: 25.5 },
      { eu: 41, us: 8.5, uk: 7.5, cm: 26.0 },
      { eu: 42, us: 9,   uk: 8,   cm: 26.5 },
      { eu: 42.5, us: 9.5, uk: 8.5, cm: 27.0 },
      { eu: 43, us: 10,  uk: 9,   cm: 27.5 },
      { eu: 44, us: 10.5,uk: 9.5, cm: 28.0 },
      { eu: 44.5, us: 11, uk: 10, cm: 28.5 },
      { eu: 45, us: 11.5,uk: 10.5,cm: 29.0 },
      { eu: 46, us: 12,  uk: 11,  cm: 29.5 },
    ];

    // Quy tắc đặc trưng theo Brand (tên không phân biệt hoa thường)
    const BRAND_NOTES = {
      'nike':    'Nike thường chật một chút — nên chọn tăng thêm 0.5 size nếu bạn có mu bàn chân cao.',
      'adidas':  'Adidas Ultraboost/NMD vừa chuẩn size; riêng dòng Yeezy nên tăng 0.5 size.',
      'jordan':  'Jordan thường chật — khuyến khích tăng 0.5 size, đặc biệt các dòng Low.',
      'new balance': 'New Balance sizing chuẩn, phù hợp chân bản to hơn so với Nike.',
      'converse': 'Converse thường rộng — có thể giảm 0.5 - 1 size.',
      'vans':    'Vans vừa chuẩn size thông thường.',
    };

    let sizeTable = UNIVERSAL_SIZE_TABLE;
    let brandNote = null;
    let brandNameUsed = 'Quốc tế';

    if (brand) {
      // Tìm brand trong DB theo tên
      const brandDoc = await Brand.findOne({ name: { $regex: brand, $options: 'i' } });
      if (brandDoc) {
        brandNameUsed = brandDoc.name;
        // Thử tìm size guide trong DB
        const dbGuide = await SizeGuide.findOne({ brandId: brandDoc._id, gender });
        if (dbGuide && dbGuide.sizes?.length > 0) {
          sizeTable = dbGuide.sizes;
        }
        brandNote = BRAND_NOTES[brand.toLowerCase()] || null;
      }
    }

    // Tìm size khớp gần nhất
    let bestMatch = null;
    let minDiff = Infinity;

    for (const size of sizeTable) {
      const diff = Math.abs((size.cm || 0) - footCm);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = size;
      }
    }

    if (!bestMatch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy size phù hợp' });
    }

    // Đánh giá mức độ khớp
    let fitMessage = '';
    if (minDiff <= 0.3) {
      fitMessage = 'Rất khớp — đây là size lý tưởng nhất cho bàn chân của bạn.';
    } else if (minDiff <= 0.7) {
      fitMessage = 'Khớp tốt — size này sẽ vừa vặn thoải mái.';
    } else {
      fitMessage = 'Tương đối phù hợp — hãy thử giày trực tiếp nếu có thể.';
    }

    return res.json({
      success: true,
      data: {
        input: { footLengthCm: footCm, brand: brandNameUsed, gender },
        suggestion: {
          eu: bestMatch.eu,
          us: bestMatch.us,
          uk: bestMatch.uk,
          cm: bestMatch.cm,
          fitMessage,
          brandNote,
          tip: 'Mẹo: Buổi chiều bàn chân thường to hơn buổi sáng ~0.5cm. Nên đo và thử giày vào buổi chiều để chọn size chuẩn nhất!'
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
