import Product from '../models/Product.js';

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Thiếu API Key.' });
    }

    // 1. Phân tích ý định khách hàng (Intent Analysis)
    const isPhoneNumber = /(0[3|5|7|8|9])([0-9]{8})\b/.test(message.replace(/\s/g, ''));
    const isRunning = /chạy bộ|running|marathon|jogging/i.test(message);
    const isAdvice = /vệ sinh|bảo quản|giặt|làm sạch|chăm sóc|tư vấn size|chọn size/i.test(message);
    const sizeMatch = message.match(/size\s?(\d{2})/i);
    const requestedSize = sizeMatch ? sizeMatch[1] : null;

    // 2. Xử lý nếu là Số điện thoại
    if (isPhoneNumber) {
      return res.json({ 
        success: true, 
        reply: "Dạ, FootMark đã nhận được số điện thoại của bạn. Nhân viên bên mình sẽ liên hệ tư vấn ngay ạ! Cảm ơn bạn." 
      });
    }

    // 3. Truy vấn dữ liệu sản phẩm (Chỉ lấy nếu không phải là hỏi mẹo)
    let formattedProducts = "";
    if (!isAdvice) {
      let query = { isActive: { $ne: false } };
      if (isRunning) {
        query.$or = [{ name: /running|chạy bộ/i }, { description: /chạy bộ/i }, { tags: /running/i }];
      }
      if (requestedSize) {
        query['variants.size'] = requestedSize;
        query['variants.stock'] = { $gt: 0 };
      }

      try {
        const allProducts = await Product.find(query).select('name price brand slug variants specs tags').limit(10);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        formattedProducts = allProducts.map(p => {
          const productLink = `${frontendUrl}/products/${p.slug || p._id}`;
          return `- ${p.name}: ${p.price.toLocaleString()}đ (Link: ${productLink})`;
        }).join('\n');
      } catch (e) { console.error(e); }
    }

    const systemPrompt = `Bạn là Chuyên gia tư vấn cao cấp của FootMark - Hệ thống giày Sneaker New & 2Hand tuyển chọn.
    
    DANH SÁCH SẢN PHẨM KHẢ DỤNG:
    ${formattedProducts || "Dạ hiện shop đang cập nhật thêm hàng mới ạ."}

    CẨM NANG VẬN HÀNH & CHÍNH SÁCH (TƯ VẤN CHÍNH XÁC):
    1. CAM KẾT AUTHENTIC & XUẤT XỨ: 
       - FootMark cam kết 100% hàng chính hãng (Authentic). 
       - Về xuất xứ: Các thương hiệu lớn như Nike, Adidas, New Balance... có nhà máy gia công trên toàn cầu. Việc giày ghi "Made in Vietnam", "Made in China" hay "Made in Indonesia" là hoàn toàn bình thường và là hàng chuẩn của hãng, khách yên tâm nhé.
    2. BẢO HÀNH & ĐỔI TRẢ:
       - Đổi trả trong vòng 7 ngày nếu lỗi size hoặc lỗi nhà sản xuất (giày chưa qua sử dụng).
       - Bảo hành keo và chỉ khâu trong 30 ngày cho mọi sản phẩm.
    3. DỊCH VỤ THU CŨ ĐỔI MỚI (TRADE-IN):
       - Shop nhận thu mua/ký gửi giày cũ chính hãng để hỗ trợ khách lên đời giày mới với giá ưu đãi. Khách gửi ảnh qua Zalo để shop định giá nhé.
    4. VẬN CHUYỂN: Giao hàng toàn quốc từ 2-4 ngày. Đơn trên 1 triệu được Freeship ạ.
    5. TIN TỨC & BLOG: Shop thường xuyên cập nhật xu hướng và mẹo phối đồ tại phần "Tin tức". Khách có thể ghé xem để có thêm ý tưởng outfit nhé.
    6. VỆ SINH & SIZE: (Nike/Jordan ôm - tăng 0.5 size; Adidas Samba hẹp ngang; Da lộn không dùng nước; Da trơn lau khăn ẩm).

    QUY TẮC PHỤC VỤ CHUYÊN NGHIỆP:
    - Luôn lễ phép: "Dạ" đầu câu và "ạ/nhé" cuối câu.
    - Gọn gàng: Trả lời thẳng vào vấn đề, tối đa 3-4 câu.
    - Luôn đính kèm Link sản phẩm khi tư vấn mẫu cụ thể.

    KHÁCH HỎI: ${message}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Google API Error');

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Dạ, hiện em chưa tìm thấy mẫu phù hợp ạ.";

    res.json({ success: true, reply: aiText.trim() });

  } catch (error) {
    console.error('❌ AI ERROR:', error.message);
    res.status(500).json({ success: false, message: `Lỗi: ${error.message}` });
  }
};
