import Product from '../models/Product.js';
import { escapeRegex } from '../utils/helpers.js';

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ ERROR: GEMINI_API_KEY is missing in process.env');
      return res.status(500).json({ success: false, message: 'Thiếu API Key (Vui lòng kiểm tra Vercel Env).' });
    }

    // 1. Phân tích ý định khách hàng (Intent Analysis)
    const isPhoneNumber = /(0[3|5|7|8|9])([0-9]{8})\b/.test(message.replace(/\s/g, ''));
    const isRunning = /chạy bộ|running|marathon|jogging/i.test(message);
    const isAdvice = /vệ sinh|bảo quản|giặt|làm sạch|chăm sóc|tư vấn size|chọn size/i.test(message);
    const isHotDeal = /deal hot|bán chạy|phổ biến|mua nhiều/i.test(message);
    const isNewArrivals = /mới nhất|mới về|hàng mới|new arrival/i.test(message);
    
    const isUnder1M = /dưới 1.000.000đ|dưới 1 triệu/i.test(message);
    const is1To2M = /1.000.000đ - 2.000.000đ|từ 1 đến 2 triệu/i.test(message);
    const isOver2M = /trên 2.000.000đ|trên 2 triệu/i.test(message);

    const sizeMatch = message.match(/size\s?(\d{2})/i);
    const requestedSize = sizeMatch ? sizeMatch[1] : null;

    if (isPhoneNumber) {
      return res.json({ success: true, reply: "Dạ, FootMark đã nhận được số điện thoại của bạn. Nhân viên bên mình sẽ liên hệ tư vấn ngay ạ!" });
    }

    // 3. Truy vấn dữ liệu sản phẩm
    let formattedProducts = "";
    if (!isAdvice) {
      let query = { status: 'active' }; 
      let sortOption = { createdAt: -1 };

      if (isHotDeal) {
        query.$or = [{ hasPromotion: true }, { soldCount: { $gt: 0 } }];
        sortOption = { soldCount: -1 };
      }
      
      if (isUnder1M) query.price = { $lt: 1000000 };
      if (is1To2M) query.price = { $gte: 1000000, $lte: 2000000 };
      if (isOver2M) query.price = { $gt: 2000000 };
      
      if (!isUnder1M && !is1To2M && !isOver2M && !isHotDeal && !isNewArrivals) {
        const cleanMessage = message.toLowerCase().replace(/size\s?\d{2}/i, '').trim();
        const keywords = cleanMessage.split(' ').filter(word => word.length > 2 && !['giày', 'mẫu', 'cho', 'mình', 'xem', 'có', 'không', 'tư', 'vấn'].includes(word));
        if (keywords.length > 0) {
          const escapedKeywords = keywords.map(escapeRegex);
          const searchRegex = new RegExp(escapedKeywords.join('|'), 'i');
          query.$or = [{ name: { $regex: searchRegex } }, { brand: { $regex: searchRegex } }];
        }
      }

      if (isRunning) {
        query.$or = (query.$or || []).concat([{ name: { $regex: /running|chạy bộ/i } }]);
      }
      
      if (requestedSize) {
        query.variants = { $elemMatch: { options: { $elemMatch: { name: requestedSize, stock: { $gt: 0 } } } } };
      }

      try {
        const allProducts = await Product.find(query)
          .select('name price brand slug variants.options image soldCount hasPromotion originalPrice')
          .sort(sortOption).limit(6).lean();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const apiUrl = process.env.API_URL || 'http://localhost:5000';
        
        formattedProducts = allProducts.map(p => {
          const productLink = `${frontendUrl}/products/${p.slug || p._id}`;
          let imgUrl = p.image || '';
          if (imgUrl && !imgUrl.startsWith('http')) {
            imgUrl = `${apiUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          }
          // 🛡️ FIX TRIỆT ĐỂ: Mã hóa URL để xử lý khoảng trắng (biến " " thành "%20")
          const safeImgUrl = encodeURI(imgUrl);
          
          let promoInfo = "";
          if (p.hasPromotion && p.originalPrice > p.price) {
            promoInfo = ` [GIẢM GIÁ SHOCK 🔥]`;
          } else if (p.soldCount > 10) {
            promoInfo = ` [BÁN CHẠY 🏆]`;
          }

          // Đóng gói sẵn Card hoàn chỉnh, AI chỉ việc in ra
          return `![${p.name}](${safeImgUrl})\n**${p.name}**${promoInfo}\n💰 Giá: ${p.price.toLocaleString()}đ\n🔗 [XEM CHI TIẾT SẢN PHẨM](${productLink})`;
        }).join('\n\n---\n\n');
      } catch (e) { console.error('❌ DB Query Error:', e); }
    }

    const systemPrompt = `Bạn là trợ lý ảo FootMark.
    QUY TẮC:
    1. Chào khách 1 câu cực ngắn.
    2. In ra NGUYÊN VĂN các Card sản phẩm dưới đây (không được tự sửa bất cứ ký tự nào, đặc biệt là dấu ngoặc).
    3. Ngăn cách sản phẩm bằng ---.

    DANH SÁCH CARD:
    ${formattedProducts || "Dạ shop đang cập nhật thêm hàng ạ."}

    KHÁCH HỎI: ${message}`;

    const availableModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    let aiText = "";
    let success = false;

    for (const modelId of availableModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
          })
        });
        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text;
          success = true;
          break;
        }
      } catch (err) { console.error(err); }
    }

    if (!success) throw new Error("AI Connection Failed");
    res.json({ success: true, reply: aiText.trim() });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
