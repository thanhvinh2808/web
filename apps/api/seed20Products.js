
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from './models/Product.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/techstore';

const products = [
  // --- 10 SẢN PHẨM MỚI (NEW) ---
  {
    name: "Nike Air Jordan 1 Low 'Wolf Grey'",
    brand: "Nike",
    slug: "jordan-1-low-wolf-grey-" + Date.now(),
    price: 4500000,
    originalPrice: 5200000,
    description: "Phối màu cực hot dành cho giới trẻ, dễ phối đồ và cực kỳ bền bỉ.",
    categorySlug: "jordan",
    stock: 50,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Leather", styleCode: "DC0774-105" },
    variants: [{ name: "Size", options: [
      { name: "38", price: 4500000, stock: 10 },
      { name: "39", price: 4500000, stock: 15 },
      { name: "40", price: 4600000, stock: 5 }
    ]}]
  },
  {
    name: "Adidas Samba OG 'Cloud White'",
    brand: "Adidas",
    slug: "adidas-samba-og-white-" + (Date.now()+1),
    price: 3200000,
    originalPrice: 3500000,
    description: "Mẫu giày vintage quốc dân đang dẫn đầu xu hướng streetwear.",
    categorySlug: "adidas",
    stock: 30,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Suede/Leather", styleCode: "B75806" },
    variants: [{ name: "Size", options: [
      { name: "40", price: 3200000, stock: 10 },
      { name: "41", price: 3200000, stock: 10 },
      { name: "42", price: 3300000, stock: 10 }
    ]}]
  },
  {
    name: "Nike Dunk Low 'Panda'",
    brand: "Nike",
    slug: "nike-dunk-low-panda-" + (Date.now()+2),
    price: 2800000,
    originalPrice: 3200000,
    description: "Phối màu đen trắng kinh điển, không bao giờ lỗi mốt.",
    categorySlug: "nike",
    stock: 100,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Leather", styleCode: "DD1391-100" },
    variants: [{ name: "Size", options: [{ name: "42", price: 2800000, stock: 50 }, { name: "43", price: 2800000, stock: 50 }]}]
  },
  {
    name: "New Balance 530 'Steel Grey'",
    brand: "New Balance",
    slug: "nb-530-steel-grey-" + (Date.now()+3),
    price: 2900000,
    originalPrice: 3100000,
    description: "Giày chạy bộ phong cách retro, cực kỳ êm ái cho hoạt động hàng ngày.",
    categorySlug: "lifestyle",
    stock: 20,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Mesh", styleCode: "MR530KA" },
    variants: [{ name: "Size", options: [{ name: "37", price: 2900000, stock: 10 }, { name: "38", price: 2900000, stock: 10 }]}]
  },
  {
    name: "Nike Air Force 1 '07 White",
    brand: "Nike",
    slug: "af1-07-white-" + (Date.now()+4),
    price: 2600000,
    originalPrice: 2900000,
    description: "Huyền thoại của mọi huyền thoại. Trắng tinh khôi, cân mọi outfit.",
    categorySlug: "nike",
    stock: 60,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Leather", styleCode: "CW2288-111" },
    variants: [{ name: "Size", options: [{ name: "40", price: 2600000, stock: 20 }, { name: "41", price: 2600000, stock: 20 }]}]
  },
  {
    name: "Jordan 1 High 'Lost and Found'",
    brand: "Jordan",
    slug: "j1-high-lost-found-" + (Date.now()+5),
    price: 11500000,
    originalPrice: 13000000,
    description: "Siêu phẩm tái hiện vẻ đẹp vintage của năm 1985.",
    categorySlug: "jordan",
    stock: 5,
    featured: true,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Cracked Leather", styleCode: "DZ5485-612" },
    variants: [{ name: "Size", options: [{ name: "42", price: 11500000, stock: 2 }, { name: "43", price: 12000000, stock: 1 }]}]
  },
  {
    name: "Adidas Campus 00s 'Core Black'",
    brand: "Adidas",
    slug: "adidas-campus-black-" + (Date.now()+6),
    price: 2700000,
    originalPrice: 3000000,
    description: "Thiết kế mập mạp, đậm chất skating từ những năm 2000.",
    categorySlug: "adidas",
    stock: 15,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Suede", styleCode: "HQ8708" },
    variants: [{ name: "Size", options: [{ name: "41", price: 2700000, stock: 5 }, { name: "42", price: 2700000, stock: 5 }]}]
  },
  {
    name: "Nike Dunk Low 'Grey Fog'",
    brand: "Nike",
    slug: "dunk-grey-fog-" + (Date.now()+7),
    price: 3800000,
    originalPrice: 4200000,
    description: "Sự kết hợp tinh tế giữa màu xám sương mù và trắng.",
    categorySlug: "nike",
    stock: 12,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Leather", styleCode: "DD1391-103" },
    variants: [{ name: "Size", options: [{ name: "40", price: 3800000, stock: 6 }]}]
  },
  {
    name: "New Balance 2002R 'Protection Pack'",
    brand: "New Balance",
    slug: "nb-2002r-protection-" + (Date.now()+8),
    price: 4800000,
    originalPrice: 5500000,
    description: "Vẻ ngoài bụi bặm, phá cách với các lớp da cắt xẻ.",
    categorySlug: "lifestyle",
    stock: 8,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Suede/Mesh", styleCode: "M2002RDA" },
    variants: [{ name: "Size", options: [{ name: "42", price: 4800000, stock: 3 }]}]
  },
  {
    name: "MLB Chunky Liner 'New York Yankees'",
    brand: "MLB",
    slug: "mlb-chunky-liner-ny-" + (Date.now()+9),
    price: 2400000,
    originalPrice: 2800000,
    description: "Giày đế cao tôn dáng, phong cách trẻ trung Hàn Quốc.",
    categorySlug: "lifestyle",
    stock: 25,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", material: "Synthetic Leather", styleCode: "3ASXCB12N-50WHS" },
    variants: [{ name: "Size", options: [{ name: "37", price: 2400000, stock: 10 }]}]
  },

  // --- 10 SẢN PHẨM CŨ (2HAND) ---
  {
    name: "[2Hand] Nike Air Jordan 1 High 'Shadow'",
    brand: "Jordan",
    slug: "2hand-j1-shadow-" + (Date.now()+10),
    price: 3500000,
    originalPrice: 6500000,
    description: "Độ mới 98%, da còn rất đẹp, đế mòn nhẹ. Giá cực tốt cho một đôi High-top.",
    categorySlug: "jordan",
    stock: 1,
    isNew: false,
    specs: { condition: "98%", accessories: "Replacement Box", material: "Leather", styleCode: "555088-013" },
    variants: [{ name: "Size", options: [{ name: "42.5", price: 3500000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Nike Dunk Low 'University Blue'",
    brand: "Nike",
    slug: "2hand-dunk-uniblue-" + (Date.now()+11),
    price: 2900000,
    originalPrice: 5000000,
    description: "Tình trạng 95%, màu xanh sky cực đẹp. Đã vệ sinh sạch sẽ.",
    categorySlug: "nike",
    stock: 1,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", material: "Leather", styleCode: "DD1391-102" },
    variants: [{ name: "Size", options: [{ name: "41", price: 2900000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Adidas Yeezy Boost 350 V2 'Zebra'",
    brand: "Adidas",
    slug: "2hand-yeezy-zebra-" + (Date.now()+12),
    price: 4200000,
    originalPrice: 9000000,
    description: "Độ mới 90%, đế có ố vàng nhẹ theo thời gian (vẻ đẹp vintage). Boost vẫn còn rất êm.",
    categorySlug: "adidas",
    stock: 1,
    isNew: false,
    specs: { condition: "90%", accessories: "Fullbox", material: "Primeknit", styleCode: "CP9654" },
    variants: [{ name: "Size", options: [{ name: "42", price: 4200000, stock: 1 }]}]
  },
  {
    name: "[2Hand] New Balance 990v5 'Grey'",
    brand: "New Balance",
    slug: "2hand-nb-990v5-" + (Date.now()+13),
    price: 2800000,
    originalPrice: 5500000,
    description: "Hàng Made in USA, độ mới 97%. Dòng giày êm ái nhất của NB.",
    categorySlug: "lifestyle",
    stock: 1,
    isNew: false,
    specs: { condition: "97%", accessories: "Replacement Box", material: "Suede", styleCode: "M990GL5" },
    variants: [{ name: "Size", options: [{ name: "43", price: 2800000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Nike Air Force 1 Stussy 'Fossil'",
    brand: "Nike",
    slug: "2hand-af1-stussy-" + (Date.now()+14),
    price: 3900000,
    originalPrice: 8000000,
    description: "Bản collab giới hạn, độ mới 99% (Like New). Chất liệu vải gai dầu độc đáo.",
    categorySlug: "nike",
    stock: 1,
    isNew: false,
    specs: { condition: "Like New", accessories: "Fullbox", material: "Hemp", styleCode: "CZ9084-200" },
    variants: [{ name: "Size", options: [{ name: "40.5", price: 3900000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Air Jordan 4 'Military Black'",
    brand: "Jordan",
    slug: "2hand-j4-military-" + (Date.now()+15),
    price: 5500000,
    originalPrice: 11000000,
    description: "Độ mới 96%, form còn cực chuẩn. Một trong những phối màu đẹp nhất của J4.",
    categorySlug: "jordan",
    stock: 1,
    isNew: false,
    specs: { condition: "96%", accessories: "Fullbox", material: "Leather", styleCode: "DH6927-111" },
    variants: [{ name: "Size", options: [{ name: "42", price: 5500000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Nike Sacai VaporWaffle",
    brand: "Nike",
    slug: "2hand-sacai-waffle-" + (Date.now()+16),
    price: 4800000,
    originalPrice: 12000000,
    description: "Tình trạng 95%, gót có trầy xước nhẹ. Thiết kế double layer cực dị.",
    categorySlug: "nike",
    stock: 1,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", material: "Mesh/Suede", styleCode: "CV1363-001" },
    variants: [{ name: "Size", options: [{ name: "41", price: 4800000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Adidas Forum Low 'White Blue'",
    brand: "Adidas",
    slug: "2hand-adidas-forum-" + (Date.now()+17),
    price: 1200000,
    originalPrice: 2800000,
    description: "Độ mới 98%, ít sử dụng. Phù hợp cho các bạn học sinh sinh viên.",
    categorySlug: "adidas",
    stock: 1,
    isNew: false,
    specs: { condition: "98%", accessories: "Replacement Box", material: "Leather", styleCode: "FY7756" },
    variants: [{ name: "Size", options: [{ name: "42", price: 1200000, stock: 1 }]}]
  },
  {
    name: "[2Hand] New Balance 550 'White Green'",
    brand: "New Balance",
    slug: "2hand-nb-550-green-" + (Date.now()+18),
    price: 1900000,
    originalPrice: 3500000,
    description: "Tình trạng 97%. Phối màu xanh vintage rất dễ mặc đồ.",
    categorySlug: "lifestyle",
    stock: 1,
    isNew: false,
    specs: { condition: "97%", accessories: "Fullbox", material: "Leather", styleCode: "BB550WT1" },
    variants: [{ name: "Size", options: [{ name: "40", price: 1900000, stock: 1 }]}]
  },
  {
    name: "[2Hand] Converse Chuck 70 High 'Parchment'",
    brand: "Converse",
    slug: "2hand-converse-70s-" + (Date.now()+19),
    price: 850000,
    originalPrice: 2000000,
    description: "Độ mới 95%, đế chưa mòn nhiều. Màu kem classic.",
    categorySlug: "lifestyle",
    stock: 1,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", material: "Canvas", styleCode: "162053C" },
    variants: [{ name: "Size", options: [{ name: "41", price: 850000, stock: 1 }]}]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Thêm link ảnh placeholder chất lượng cao cho đẹp web
    const seededProducts = products.map((p, idx) => ({
      ...p,
      image: `https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/${(idx % 10) + 1}.png`,
      images: [
        { url: `https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/${(idx % 10) + 1}.png`, alt: p.name, isPrimary: true },
        { url: `https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/${((idx+1) % 10) + 1}.png`, alt: p.name, isPrimary: false }
      ]
    }));

    await Product.insertMany(seededProducts);
    console.log('Successfully seeded 20 products!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
