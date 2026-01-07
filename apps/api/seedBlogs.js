// seedBlogs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog.js'; // Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn

dotenv.config();

const blogs = [
  {
    title: "Top 10 Laptop Gaming Tốt Nhất 2024",
    slug: "top-10-laptop-gaming-tot-nhat-2024",
    excerpt: "Khám phá danh sách 10 laptop gaming mạnh mẽ nhất hiện nay với cấu hình khủng và giá cả hợp lý cho game thủ.",
    content: `
# Top 10 Laptop Gaming Tốt Nhất 2024

Trong năm 2024, thị trường laptop gaming đã có nhiều sản phẩm mới với hiệu năng vượt trội. Dưới đây là top 10 laptop gaming đáng mua nhất hiện nay.

## 1. ASUS ROG Strix G15

Laptop gaming cao cấp với chip AMD Ryzen 9, RTX 4070, màn hình 165Hz. Thiết kế đẹp mắt, hiệu năng mạnh mẽ.

## 2. MSI Katana 15

Lựa chọn tốt trong tầm giá trung với chip Intel Core i7, RTX 4060. Phù hợp cho game thủ sinh viên.

## 3. Acer Predator Helios 300

Laptop gaming phổ biến với cấu hình cân bằng, tản nhiệt tốt, giá cả hợp lý.

## Kết luận

Mỗi laptop đều có ưu nhược điểm riêng. Hãy chọn máy phù hợp với nhu cầu và ngân sách của bạn.
    `,
    image: "/images/blogs/laptop-gaming.jpg",
    category: "Laptop",
    tags: ["laptop", "gaming", "review", "2024"],
    featured: true,
    author: {
      name: "Nguyễn Văn A",
      avatar: ""
    },
    views: 1250,
    published: true
  },
  {
    title: "Hướng Dẫn Chọn Mua Điện Thoại Phù Hợp",
    slug: "huong-dan-chon-mua-dien-thoai-phu-hop",
    excerpt: "Những tiêu chí quan trọng bạn cần biết khi chọn mua smartphone mới trong năm 2024.",
    content: `
# Hướng Dẫn Chọn Mua Điện Thoại Phù Hợp

Việc chọn mua một chiếc điện thoại phù hợp không hề đơn giản. Dưới đây là những tiêu chí quan trọng bạn cần lưu ý.

## 1. Xác định nhu cầu sử dụng

- Chơi game: Cần chip mạnh, RAM lớn
- Chụp ảnh: Ưu tiên camera tốt
- Công việc: Pin trâu, màn hình đẹp

## 2. Ngân sách

- Dưới 5 triệu: Xiaomi, Realme
- 5-10 triệu: Samsung A series, iPhone cũ
- Trên 10 triệu: iPhone mới, Samsung S series

## 3. Hệ điều hành

- iOS: Ổn định, lâu dài
- Android: Đa dạng, tùy biến cao

## Kết luận

Chọn điện thoại phù hợp với nhu cầu và túi tiền. Đừng chạy theo xu hướng một cách mù quáng.
    `,
    image: "/images/blogs/chon-mua-dien-thoai.jpg",
    category: "Smartphone",
    tags: ["smartphone", "tips", "guide"],
    featured: true,
    author: {
      name: "Trần Thị B",
      avatar: ""
    },
    views: 890,
    published: true
  },
  {
    title: "So Sánh iPhone 15 Pro Max vs Samsung S24 Ultra",
    slug: "so-sanh-iphone-15-pro-max-vs-samsung-s24-ultra",
    excerpt: "Cuộc đối đầu giữa hai flagship cao cấp nhất của Apple và Samsung. Đâu là lựa chọn tốt hơn?",
    content: `
# So Sánh iPhone 15 Pro Max vs Samsung S24 Ultra

Hai siêu phẩm flagship của năm 2024. Cùng so sánh chi tiết để tìm ra lựa chọn phù hợp nhất.

## Thiết kế

**iPhone 15 Pro Max:**
- Khung Titanium cao cấp
- Mỏng nhẹ hơn
- Dynamic Island độc đáo

**Samsung S24 Ultra:**
- Khung nhôm chắc chắn
- Màn hình phẳng
- S Pen tiện lợi

## Hiệu năng

- iPhone: A17 Pro (3nm)
- Samsung: Snapdragon 8 Gen 3

Cả hai đều mạnh mẽ, xử lý mượt mọi tác vụ.

## Camera

**iPhone:** Xử lý màu tự nhiên, video đỉnh cao
**Samsung:** Zoom 100x, nhiều tính năng AI

## Kết luận

- Chọn iPhone nếu: Thích iOS, quay video, hệ sinh thái Apple
- Chọn Samsung nếu: Thích Android, cần S Pen, màn hình lớn
    `,
    image: "/images/blogs/iphone-vs-samsung.jpg",
    category: "Smartphone",
    tags: ["iphone", "samsung", "comparison", "flagship"],
    featured: true,
    author: {
      name: "Lê Văn C",
      avatar: ""
    },
    views: 2150,
    published: true
  },
  {
    title: "5 Phụ Kiện Công Nghệ Đáng Mua Nhất 2024",
    slug: "5-phu-kien-cong-nghe-dang-mua-nhat-2024",
    excerpt: "Những phụ kiện công nghệ hữu ích giúp nâng cao trải nghiệm sử dụng thiết bị của bạn.",
    content: `
# 5 Phụ Kiện Công Nghệ Đáng Mua Nhất 2024

## 1. Tai nghe True Wireless

- AirPods Pro 2
- Sony WF-1000XM5
- Chống ồn chủ động, âm thanh đỉnh cao

## 2. Sạc dự phòng

- Anker PowerCore 20000mAh
- Xiaomi Mi Power Bank 3
- Sạc nhanh, nhiều cổng

## 3. Ốp lưng chống sốc

- UAG Civilian
- Spigen Tough Armor
- Bảo vệ tối đa cho điện thoại

## 4. Giá đỡ điện thoại

- Baseus Gravity
- MOFT X
- Tiện lợi khi xem phim, gọi video

## 5. Cáp sạc nhanh

- Anker PowerLine III
- Baseus 100W
- Chất lượng cao, bền bỉ

## Kết luận

Đầu tư vào phụ kiện chất lượng sẽ giúp bạn tận dụng tối đa thiết bị của mình.
    `,
    image: "/images/blogs/phu-kien-cong-nghe.jpg",
    category: "Accessories",
    tags: ["accessories", "gadgets", "2024"],
    featured: false,
    author: {
      name: "Phạm Thị D",
      avatar: ""
    },
    views: 650,
    published: true
  },
  {
    title: "Cách Tối Ưu Pin Điện Thoại Hiệu Quả",
    slug: "cach-toi-uu-pin-dien-thoai-hieu-qua",
    excerpt: "Bí quyết giúp pin điện thoại của bạn bền bỉ hơn và kéo dài thời gian sử dụng.",
    content: `
# Cách Tối Ưu Pin Điện Thoại Hiệu Quả

## 1. Giảm độ sáng màn hình

Màn hình tiêu tốn nhiều pin nhất. Giảm độ sáng xuống mức vừa đủ.

## 2. Tắt các tính năng không cần thiết

- Bluetooth
- GPS
- NFC
- Wi-Fi khi không dùng

## 3. Sử dụng chế độ tiết kiệm pin

Kích hoạt chế độ tiết kiệm pin khi cần thiết.

## 4. Đóng ứng dụng chạy nền

Xóa các ứng dụng không sử dụng đang chạy nền.

## 5. Cập nhật phần mềm

Luôn cập nhật hệ điều hành và ứng dụng mới nhất.

## 6. Tránh nhiệt độ quá cao/thấp

Nhiệt độ ảnh hưởng lớn đến tuổi thọ pin.

## Kết luận

Áp dụng những mẹo trên, pin điện thoại của bạn sẽ bền bỉ hơn rất nhiều.
    `,
    image: "/images/blogs/toi-uu-pin.jpg",
    category: "Tips & Tricks",
    tags: ["battery", "tips", "smartphone"],
    featured: false,
    author: {
      name: "Hoàng Văn E",
      avatar: ""
    },
    views: 1520,
    published: true
  },
  {
    title: "Xu Hướng Công Nghệ 2024",
    slug: "xu-huong-cong-nghe-2024",
    excerpt: "Những xu hướng công nghệ đáng chú ý sẽ thay đổi cuộc sống của chúng ta trong năm 2024.",
    content: `
# Xu Hướng Công Nghệ 2024

## 1. AI và Machine Learning

Trí tuệ nhân tạo ngày càng phát triển, ứng dụng rộng rãi trong mọi lĩnh vực.

## 2. 5G mở rộng

Mạng 5G phủ sóng rộng hơn, tốc độ nhanh hơn.

## 3. Smartphone gập

Điện thoại màn hình gập ngày càng hoàn thiện, giá cả hợp lý hơn.

## 4. Wearable Technology

Thiết bị đeo thông minh theo dõi sức khỏe ngày càng phổ biến.

## 5. Cloud Gaming

Chơi game trên đám mây không cần cấu hình cao.

## 6. IoT Smart Home

Nhà thông minh với các thiết bị IoT kết nối.

## Kết luận

Công nghệ phát triển nhanh chóng, thay đổi cách chúng ta sống và làm việc.
    `,
    image: "/images/blogs/xu-huong-2024.jpg",
    category: "Technology",
    tags: ["trends", "technology", "2024", "future"],
    featured: true,
    author: {
      name: "Admin",
      avatar: ""
    },
    views: 980,
    published: true
  },
  {
    title: "Review Chi Tiết MacBook Air M3",
    slug: "review-chi-tiet-macbook-air-m3",
    excerpt: "Đánh giá toàn diện về MacBook Air M3 - Laptop mỏng nhẹ mạnh mẽ nhất của Apple.",
    content: `
# Review Chi Tiết MacBook Air M3

## Thiết kế

- Mỏng 11.3mm, nhẹ 1.24kg
- 4 màu sắc: Bạc, Xám, Vàng, Đen
- Khung nhôm nguyên khối cao cấp

## Hiệu năng

**Chip M3 8-core:**
- CPU: 4 nhân hiệu suất cao + 4 nhân tiết kiệm
- GPU: 8-10 nhân
- RAM: 8GB/16GB/24GB

**Benchmark:**
- Geekbench 5: Single 2100, Multi 9800
- Cinebench R23: 1500/8500

## Màn hình

- 13.6 inch Liquid Retina
- Độ phân giải 2560x1664
- 500 nits độ sáng
- Wide color (P3)

## Pin

- 52.6Wh
- Lướt web: 15 giờ
- Xem video: 18 giờ

## Giá bán

- 8GB/256GB: 28.990.000đ
- 16GB/512GB: 35.990.000đ

## Ưu điểm

✅ Hiệu năng mạnh mẽ
✅ Pin trâu
✅ Mỏng nhẹ
✅ Không quạt, êm ái

## Nhược điểm

❌ RAM hàn, không nâng cấp
❌ Chỉ 2 cổng USB-C
❌ Giá cao

## Kết luận

MacBook Air M3 là lựa chọn tuyệt vời cho sinh viên, văn phòng, sáng tạo nội dung nhẹ.

**Điểm: 9/10**
    `,
    image: "/images/blogs/macbook-air-m3.jpg",
    category: "Laptop",
    tags: ["macbook", "apple", "review", "m3"],
    featured: true,
    author: {
      name: "Nguyễn Văn A",
      avatar: ""
    },
    views: 3200,
    published: true
  },
  {
    title: "Bảo Mật Điện Thoại: Những Điều Cần Biết",
    slug: "bao-mat-dien-thoai-nhung-dieu-can-biet",
    excerpt: "Hướng dẫn bảo vệ dữ liệu cá nhân và tăng cường bảo mật cho smartphone của bạn.",
    content: `
# Bảo Mật Điện Thoại: Những Điều Cần Biết

## 1. Sử dụng mật khẩu mạnh

- Tối thiểu 8 ký tự
- Kết hợp chữ, số, ký tự đặc biệt
- Không dùng thông tin cá nhân

## 2. Bật xác thực hai yếu tố (2FA)

Thêm lớp bảo mật cho tài khoản quan trọng.

## 3. Cập nhật phần mềm thường xuyên

Cập nhật hệ điều hành và ứng dụng để vá lỗ hổng bảo mật.

## 4. Cẩn thận với Wi-Fi công cộng

Không truy cập tài khoản ngân hàng trên Wi-Fi công cộng.

## 5. Kiểm tra quyền truy cập ứng dụng

Xem lại quyền mà các ứng dụng yêu cầu.

## 6. Sao lưu dữ liệu

Backup định kỳ dữ liệu quan trọng.

## 7. Sử dụng VPN

VPN mã hóa kết nối internet của bạn.

## 8. Cài đặt antivirus

Bảo vệ khỏi malware và virus.

## Kết luận

Bảo mật là trách nhiệm của mỗi người dùng. Hãy áp dụng các biện pháp trên để bảo vệ dữ liệu cá nhân.
    `,
    image: "/images/blogs/bao-mat-dien-thoai.jpg",
    category: "Security",
    tags: ["security", "privacy", "tips"],
    featured: false,
    author: {
      name: "Trần Thị B",
      avatar: ""
    },
    views: 720,
    published: true
  },
  {
    title: "Top Ứng Dụng Hữu Ích Cho Điện Thoại",
    slug: "top-ung-dung-huu-ich-cho-dien-thoai",
    excerpt: "Danh sách những ứng dụng không thể thiếu trên smartphone của bạn.",
    content: `
# Top Ứng Dụng Hữu Ích Cho Điện Thoại

## 1. Năng suất

**Notion**
- Ghi chú, quản lý công việc
- Đa nền tảng

**Todoist**
- Quản lý task hiệu quả
- Nhắc nhở thông minh

## 2. Học tập

**Duolingo**
- Học ngoại ngữ miễn phí
- Gamification thú vị

**Khan Academy**
- Học mọi môn học
- Video bài giảng chất lượng

## 3. Sức khỏe

**MyFitnessPal**
- Theo dõi calories
- Kế hoạch ăn uống

**Headspace**
- Thiền định, thư giãn
- Giảm stress

## 4. Tài chính

**Momo**
- Ví điện tử
- Thanh toán tiện lợi

**Cake**
- Học tiếng Anh qua video
- Miễn phí

## 5. Giải trí

**Spotify**
- Nghe nhạc streaming
- Podcast phong phú

**Netflix**
- Xem phim, series
- Chất lượng cao

## Kết luận

Những ứng dụng trên sẽ giúp bạn tối ưu hóa việc sử dụng smartphone.
    `,
    image: "/images/blogs/ung-dung-huu-ich.jpg",
    category: "Apps",
    tags: ["apps", "productivity", "lifestyle"],
    featured: false,
    author: {
      name: "Lê Văn C",
      avatar: ""
    },
    views: 1100,
    published: true
  },
  {
    title: "Hướng Dẫn Chụp Ảnh Đẹp Bằng Điện Thoại",
    slug: "huong-dan-chup-anh-dep-bang-dien-thoai",
    excerpt: "Những mẹo và kỹ thuật giúp bạn chụp ảnh đẹp hơn với smartphone.",
    content: `
# Hướng Dẫn Chụp Ảnh Đẹp Bằng Điện Thoại

## 1. Ánh sáng

- Chụp vào buổi sáng sớm hoặc chiều tối (Golden Hour)
- Tận dụng ánh sáng tự nhiên qua cửa sổ
- Tránh chụp ngược sáng trừ khi muốn tạo hiệu ứng bóng (silhouette)

## 2. Bố cục (Composition)

- **Quy tắc 1/3:** Bật lưới (grid) trên camera và đặt chủ thể vào các giao điểm.
- **Đường dẫn:** Sử dụng các đường thẳng tự nhiên (con đường, hàng rào) để dẫn mắt người xem.
- **Khoảng trống:** Để lại không gian thở cho bức ảnh.

## 3. Giữ ống kính sạch sẽ

Đây là lỗi phổ biến nhất khiến ảnh bị mờ hoặc lóa sáng. Hãy lau sạch camera trước khi chụp.

## 4. Lấy nét và phơi sáng

- Chạm vào màn hình để lấy nét đúng chủ thể.
- Kéo thanh trượt bên cạnh ô lấy nét để điều chỉnh độ sáng phù hợp.

## 5. Hậu kỳ

Đừng quên chỉnh sửa nhẹ bằng các ứng dụng như Lightroom, Snapseed hoặc VSCO để màu sắc ấn tượng hơn.

## Kết luận

Chiếc máy ảnh tốt nhất là chiếc máy ảnh bạn đang có. Hãy thực hành thường xuyên để nâng cao tay nghề.
    `,
    image: "/images/blogs/chup-anh-dep.jpg",
    category: "Photography",
    tags: ["photography", "tips", "mobile", "camera"],
    featured: false,
    author: {
      name: "Phạm Thị D",
      avatar: ""
    },
    views: 1800,
    published: true
  }
];

// --- HÀM THỰC THI SEED DATA ---

const seedData = async () => {
  try {
    // Kết nối MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Xóa dữ liệu cũ (để tránh trùng lặp khi chạy lại nhiều lần)
    await Blog.deleteMany({});
    console.log('Data destroyed...');

    // Thêm dữ liệu mới
    await Blog.insertMany(blogs);
    console.log('Data Imported!');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();