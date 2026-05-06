import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Models
import Product from './apps/api/models/Product.js';
import User from './apps/api/models/User.js';
import Review from './apps/api/models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/footmark';

const COMMENTS = [
  "Giày đẹp lắm shop ơi, form chuẩn, đi rất êm chân.",
  "Hàng giao nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop tiếp.",
  "Màu sắc y hệt hình, chất liệu da mềm, rất đáng tiền.",
  "Đã nhận được hàng, giày đi rất nhẹ và thoải mái.",
  "Shop tư vấn nhiệt tình, chọn size rất vừa vặn.",
  "Đúng là tiền nào của nấy, giày chất lượng thực sự.",
  "Lần đầu mua online mà ưng ý thế này, cảm ơn shop nhiều.",
  "Giao hàng siêu tốc, giày cầm chắc tay, đế chống trượt tốt.",
  "Phong cách rất ngầu, phối đồ cực dễ luôn.",
  "Mua làm quà tặng mà người nhận khen mãi, hên quá."
];

async function seedReviews() {
  try {
    console.log('🚀 Đang kết nối Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối thành công!');

    // 1. Lấy tất cả sản phẩm
    const products = await Product.find();
    if (products.length === 0) {
      console.log('❌ Không có sản phẩm nào để đánh giá.');
      process.exit(0);
    }

    // 2. Lấy hoặc tạo user mẫu (để tránh lỗi liên kết)
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('⚠️ Không tìm thấy User, đang tạo User mẫu...');
      user = await User.create({
        name: 'Khách hàng may mắn',
        email: `guest_${Date.now()}@example.com`,
        password: 'password123',
        role: 'user'
      });
    }

    console.log(`📝 Đang nạp đánh giá cho ${products.length} sản phẩm...`);

    let count = 0;
    for (const product of products) {
      // Mỗi sản phẩm tạo 1-3 đánh giá ngẫu nhiên
      const numReviews = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numReviews; i++) {
        try {
          const rating = Math.floor(Math.random() * 2) + 4; // Chỉ lấy 4 hoặc 5 sao
          const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];

          await Review.create({
            userId: user._id,
            productId: product._id,
            rating,
            comment,
            isPurchased: true,
            status: 'approved'
          });
          count++;
        } catch (err) {
          // Bỏ qua nếu bị lỗi Unique (User đã đánh giá sản phẩm này rồi)
          continue;
        }
      }

      // Cập nhật lại Rating trung bình và reviewCount cho Product
      const allReviews = await Review.find({ productId: product._id });
      const avgRating = allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 5;

      await Product.findByIdAndUpdate(product._id, {
        rating: Number(avgRating),
        reviewCount: allReviews.length
      });
    }

    console.log(`✨ Hoàn thành! Đã thêm mới ${count} đánh giá.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi thực thi script:', error);
    process.exit(1);
  }
}

seedReviews();
