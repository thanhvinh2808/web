// seedBlogs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog.js';

dotenv.config();

const blogs = [
  {
    title: "Cách Check Legit Giày Jordan 1 High Chi Tiết Nhất",
    slug: "huong-dan-check-legit-jordan-1-high",
    excerpt: "Đừng để bị lừa! Học ngay cách phân biệt Jordan 1 thật và giả qua các chi tiết đường may, logo và lót giày.",
    content: `
# Cách Check Legit Giày Jordan 1 High Chi Tiết Nhất

Jordan 1 là dòng giày bị làm giả nhiều nhất trên thị trường. Để trở thành một sneakerhead thông thái, bạn cần nắm vững các bước check sau:

## 1. Kiểm tra Wing Logo

Wing Logo của giày thật được dập sắc nét, chữ 'R' và 'D' trong 'JORDAN' phải chạm nhau ở phía dưới. Độ bóng của logo cũng là một dấu hiệu quan trọng.

## 2. Đường may (Stitching)

Giày chính hãng có đường may cực kỳ đều và chắc chắn. Ở phần gót giày, miếng da hình vuông nhỏ (hour-glass shape) là đặc điểm khó làm giả nhất.

## 3. Lót giày và Đế giày

Lật lót giày lên để kiểm tra phần keo. Đế giày thật có độ đàn hồi tốt, không quá cứng và có mùi cao su đặc trưng thay vì mùi hóa chất nồng nặc.

## Kết luận

Nếu vẫn chưa tự tin, hãy sử dụng các dịch vụ check uy tín hoặc mua tại các cửa hàng như FootMark để đảm bảo 100% Authentic.
    `,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800",
    category: "Check Legit",
    tags: ["jordan", "legit check", "sneaker tips"],
    featured: true,
    author: { name: "Admin FootMark", avatar: "" },
    views: 3500,
    published: true
  },
  {
    title: "5 Bước Vệ Sinh Giày Sneaker Trắng Sạch Như Mới",
    slug: "ve-sinh-giay-sneaker-trang-tai-nhà",
    excerpt: "Giày trắng bị ố vàng? Đừng lo, FootMark sẽ hướng dẫn bạn cách xử lý nhanh gọn chỉ trong 15 phút.",
    content: `
# 5 Bước Vệ Sinh Giày Sneaker Trắng Sạch Như Mới

## Bước 1: Vệ sinh khô
Dùng bàn chải mềm để phủi sạch bụi bẩn khô bám trên bề mặt giày.

## Bước 2: Sử dụng dung dịch chuyên dụng
Nên dùng các bộ vệ sinh như Jason Markk hoặc Crep Protect. Tránh dùng bột giặt có tính tẩy rửa mạnh gây ố vàng.

## Bước 3: Chải nhẹ nhàng
Chải theo vòng tròn ở những vùng vải mesh và chải xuôi theo thớ đối với da lộn.

## Bước 4: Phơi giày đúng cách
KHÔNG phơi dưới ánh nắng trực tiếp. Hãy để giày ở nơi thoáng mát, có gió.

## Bước 5: Xịt nano bảo vệ
Sau khi giày khô hoàn toàn, hãy xịt một lớp nano để chống thấm nước và bụi bẩn cho lần sử dụng sau.
    `,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
    category: "Vệ sinh giày",
    tags: ["cleaning", "sneaker care", "tips"],
    featured: true,
    author: { name: "Vinh FootMark", avatar: "" },
    views: 1200,
    published: true
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Blog.deleteMany({});
    await Blog.insertMany(blogs);
    console.log('Sneaker Blogs Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
