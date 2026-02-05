// apps/api/seedLocalSmart.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình thư mục ảnh
const UPLOAD_DIR = path.join(__dirname, 'uploads/products');

// Hàm tạo ngẫu nhiên
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomPrice = () => getRandomInt(15, 150) * 100000; // 1.5tr - 15tr

// Hàm sinh biến thể Size
const generateVariants = (price) => {
  const sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
  // Chọn ngẫu nhiên 5-8 size
  const selectedSizes = sizes.sort(() => 0.5 - Math.random()).slice(0, getRandomInt(5, 8));
  
  return [{
    name: "Size",
    options: selectedSizes.sort().map(size => ({
      name: size,
      price: price,
      stock: getRandomInt(1, 10),
      sku: `SKU-${size}-${getRandomInt(1000, 9999)}`
    }))
  }];
};

// Hàm đoán thương hiệu từ tên file
const detectBrand = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.includes('nike') || lower.includes('jordan') || lower.includes('air force') || lower.includes('dunk')) return 'Nike';
  if (lower.includes('adidas') || lower.includes('yeezy') || lower.includes('samba') || lower.includes('gazelle')) return 'Adidas';
  if (lower.includes('new balance') || lower.includes('nb')) return 'New Balance';
  if (lower.includes('asics')) return 'Asics';
  if (lower.includes('mlb')) return 'MLB';
  if (lower.includes('vans')) return 'Vans';
  if (lower.includes('converse')) return 'Converse';
  if (lower.includes('puma')) return 'Puma';
  if (lower.includes('timberland')) return 'Timberland';
  if (lower.includes('onitsuka')) return 'Onitsuka Tiger';
  return 'Other'; // Mặc định
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB...");

    // 1. Quét file ảnh
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.error("❌ Upload directory not found!");
      process.exit(1);
    }

    const files = fs.readdirSync(UPLOAD_DIR).filter(file => {
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
    });

    console.log(`📂 Found ${files.length} images in uploads folder.`);

    // 2. Tạo danh sách sản phẩm từ file
    const products = files.map(file => {
      // Xử lý tên file thành tên sản phẩm đẹp
      let name = file.replace(/\.[^/.]+$/, ""); // Bỏ đuôi .png
      name = name.replace(/[-_]/g, " "); // Thay - _ bằng khoảng trắng
      
      // Xử lý Nike/Jordan (thường tên file có cả Nike và Jordan)
      if (name.toLowerCase().includes('jordan')) {
         // Nếu là Jordan thì tách riêng brand Jordan
      }

      const brand = detectBrand(name);
      
      // Nếu là Jordan, override brand
      const finalBrand = name.toLowerCase().includes('jordan') ? 'Jordan' : brand;
      
      const price = getRandomPrice();
      const originalPrice = price + (price * 0.1); // Giá gốc cao hơn 10%

      return {
        name: name.trim(), // Tên file là tên sản phẩm
        brand: finalBrand,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4), // Unique slug
        price: price,
        originalPrice: originalPrice,
        image: `/uploads/products/${file}`, // Đường dẫn ảnh local chuẩn
        images: [{ url: `/uploads/products/${file}`, alt: name, isPrimary: true }],
        description: `<p><strong>${name}</strong> - Siêu phẩm không thể thiếu trong tủ giày của bạn.</p>
        <p>✨ Tình trạng: <strong>New</strong></p>
        <p>✨ Phụ kiện: Fullbox, giấy gói, tag</p>
        <p>✨ Cam kết chính hãng 100%, bao check trọn đời tại FootMark.</p>
        <p>Sản phẩm được chụp trực tiếp tại cửa hàng, độ mới chuẩn mô tả.</p>`,
        categorySlug: finalBrand.toLowerCase().replace(/ /g, '-'), // ✅ Fix: Brand slug (lowercase, hyphenated)
        specs: {
          condition: "New",
          accessories: "Fullbox",
          material: "Premium Leather/Suede",
          styleCode: `SNEAKER-${getRandomInt(100000, 999999)}`
        },
        rating: 5,
        stock: 20,
        soldCount: getRandomInt(0, 200),
        isNew: true, // Mặc định hàng mới
        variants: generateVariants(price)
      };
    });

    // 3. Xóa và nạp lại Database
    // Cập nhật Categories để đảm bảo Brand có trong danh mục
    const uniqueBrands = [...new Set(products.map(p => p.brand))];
    const categories = uniqueBrands.map(b => ({
       name: b,
       slug: b.toLowerCase().replace(/ /g, '-'),
       description: `Best of ${b}`
    }));
    
    // Thêm danh mục chung "Sneaker"
    categories.push({ name: 'Sneaker', slug: 'sneaker', description: 'All Sneakers' });

    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log("✅ Seeded Categories:", uniqueBrands.join(', '));

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} Products from local images successfully!`);

    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
