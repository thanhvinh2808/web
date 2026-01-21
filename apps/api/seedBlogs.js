// seedBlogs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

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
  },
  {
    title: "Top 5 Mẫu Giày Sneaker Được Săn Đón Nhất Năm 2024",
    slug: "top-5-mau-giay-sneaker-sao-don-2024",
    excerpt: "Khám phá những đôi sneaker hot nhất và được yêu thích nhất trong năm nay mà bạn không thể bỏ qua.",
    content: `
# Top 5 Mẫu Giày Sneaker Được Săn Đón Nhất Năm 2024

Năm 2024 chứng kiến sự bùng nổ của nhiều mẫu sneaker mới lạ và độc đáo. Dưới đây là 5 cái tên đang làm mưa làm gió trên thị trường:

## 1. Nike Dunk Low "Panda"
Không còn quá xa lạ, "Panda" vẫn giữ vững vị thế là một trong những đôi giày dễ phối đồ và được săn đón nhiều nhất.

## 2. Adidas Samba OG
Sự trở lại mạnh mẽ của phong cách retro đã đưa Adidas Samba trở thành "must-have" item cho mọi tín đồ thời trang.

## 3. New Balance 2002R
Với sự thoải mái vượt trội và thiết kế tinh tế, New Balance 2002R là lựa chọn hoàn hảo cho cả đi làm và đi chơi.

## 4. Salomon XT-6
Xu hướng Gorpcore đang thịnh hành, và Salomon XT-6 với vẻ ngoài hầm hố, khả năng chống chịu tốt là đại diện tiêu biểu.

## 5. Asics Gel-Kayano 14
Được yêu thích bởi sự kết hợp giữa hiệu suất và phong cách, Gel-Kayano 14 mang đến trải nghiệm êm ái cùng thiết kế ấn tượng.
    `,
    image: "https://images.unsplash.com/photo-1628172937746-d872c676d1e4?auto=format&fit=crop&q=80&w=800",
    category: "Xu hướng",
    tags: ["sneaker trends", "top sneakers", "2024 fashion"],
    featured: true,
    author: { name: "FootMark Editor", avatar: "" },
    views: 4800,
    published: true
  },
  {
    title: "Lịch Sử Thương Hiệu Giày Nike Air Jordan: Từ Sân Bóng Rổ Đến Biểu Tượng Thời Trang",
    slug: "lich-su-nike-air-jordan",
    excerpt: "Hành trình huyền thoại của dòng giày Air Jordan và cách nó thay đổi văn hóa sneaker mãi mãi.",
    content: `
# Lịch Sử Thương Hiệu Giày Nike Air Jordan: Từ Sân Bóng Rổ Đến Biểu Tượng Thời Trang

Air Jordan không chỉ là một dòng giày, đó là một hiện tượng văn hóa. Bắt đầu từ năm 1984, sự hợp tác giữa Nike và Michael Jordan đã tạo ra một đế chế.

## Khởi đầu: Air Jordan 1

Air Jordan 1 ra mắt vào năm 1985, nhanh chóng trở thành một biểu tượng. Với thiết kế táo bạo và câu chuyện "bị cấm" bởi NBA, nó đã thu hút sự chú ý toàn cầu.

## Phát triển và Đổi mới

Qua mỗi phiên bản, Air Jordan luôn tiên phong về công nghệ và thiết kế. Từ Air Jordan 3 với họa tiết elephant print đến Air Jordan 11 với chất liệu patent leather, mỗi đôi giày đều có một câu chuyện riêng.

## Tầm ảnh hưởng Văn hóa

Air Jordan không chỉ dừng lại ở sân bóng rổ. Nó đã vượt ra ngoài ranh giới thể thao, trở thành một phần không thể thiếu của thời trang đường phố, âm nhạc và nghệ thuật.
    `,
    image: "https://images.unsplash.com/photo-1579730538965-dbd8e174092b?auto=format&fit=crop&q=80&w=800",
    category: "Thương hiệu",
    tags: ["nike", "air jordan", "sneaker history", "michael jordan"],
    featured: true,
    author: { name: "FootMark History", avatar: "" },
    views: 6000,
    published: true
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techstore');
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

