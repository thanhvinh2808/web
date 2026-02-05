// apps/api/seedFootMarkPro.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const sneakers = [
  {
    name: "Nike Dunk Low 'Panda' Black/White",
    brand: "Nike",
    slug: "nike-dunk-low-panda",
    price: 3200000,
    originalPrice: 4500000,
    image: "https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg",
    description: "Đôi giày quốc dân dễ phối đồ nhất mọi thời đại.",
    categorySlug: "nike",
    stock: 50,
    soldCount: 1250,
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DD1391-100", material: "Leather" },
    variants: [{ name: "Size", options: [{ name: "40", price: 3200000, stock: 15 }] }]
  },
  {
    name: "Adidas Samba OG 'Cloud White'",
    brand: "Adidas",
    slug: "adidas-samba-og-white",
    price: 3800000,
    originalPrice: 4500000,
    image: "https://images.stockx.com/images/adidas-Samba-OG-Cloud-White-Core-Black-Product.jpg",
    description: "Cơn sốt Terrace đang trở lại mạnh mẽ.",
    categorySlug: "adidas",
    stock: 25,
    soldCount: 890,
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "B75806", material: "Leather/Suede" },
    variants: [{ name: "Size", options: [{ name: "41", price: 3800000, stock: 8 }] }]
  },
  {
    name: "Nike Air Force 1 'White'",
    brand: "Nike",
    slug: "nike-af1-white",
    price: 2800000,
    image: "https://images.stockx.com/images/Nike-Air-Force-1-Low-White-07-Product.jpg",
    categorySlug: "nike",
    stock: 100,
    soldCount: 5000,
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "CW2288-111" },
    variants: [{ name: "Size", options: [{ name: "42", price: 2800000, stock: 20 }] }]
  },
  {
    name: "Air Jordan 1 High 'Chicago Lost & Found'",
    brand: "Jordan",
    slug: "jordan-1-chicago-lost-and-found",
    price: 12500000,
    image: "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Lost-and-Found-Product.jpg",
    description: "Siêu phẩm vừa cập bến.",
    categorySlug: "jordan",
    stock: 20,
    soldCount: 5,
    isNew: true,
    featured: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DZ5485-612", material: "Cracked Leather" },
    variants: [{ name: "Size", options: [{ name: "42", price: 12500000, stock: 5 }] }]
  },
  {
    name: "Travis Scott x Jordan 1 Low 'Olive'",
    brand: "Jordan",
    slug: "travis-scott-olive",
    price: 18900000,
    image: "https://images.stockx.com/images/Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Olive-W-Product.jpg",
    description: "Hàng hype mới về hôm qua.",
    categorySlug: "jordan",
    stock: 5,
    soldCount: 2,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DZ4137-106" },
    variants: [{ name: "Size", options: [{ name: "40", price: 18900000, stock: 2 }] }]
  },
  {
    name: "New Balance 9060 'Sea Salt'",
    brand: "New Balance",
    slug: "nb-9060-sea-salt",
    price: 4500000,
    image: "https://images.stockx.com/images/New-Balance-9060-Sea-Salt-White-Product.jpg",
    description: "Dòng giày mới của NB.",
    categorySlug: "new-balance",
    stock: 15,
    soldCount: 10,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "U9060MAC" },
    variants: [{ name: "Size", options: [{ name: "41", price: 4500000, stock: 5 }] }]
  },
  {
    name: "Adidas Yeezy Slide 'Onyx'",
    brand: "Yeezy",
    slug: "yeezy-slide-onyx",
    price: 2500000,
    image: "https://images.stockx.com/images/Adidas-Yeezy-Slide-Onyx-Product.jpg",
    description: "Dép quốc dân mới restock.",
    categorySlug: "yeezy",
    stock: 30,
    soldCount: 50,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "HQ6448" },
    variants: [{ name: "Size", options: [{ name: "40", price: 2500000, stock: 10 }] }]
  },
  {
    name: "MLB Bigball Chunky 'Boston'",
    brand: "MLB",
    slug: "mlb-boston",
    price: 1800000,
    image: "https://images.stockx.com/images/MLB-Big-Ball-Chunky-P-Boston-Red-Sox-White.jpg",
    description: "Hack chiều cao cực đỉnh.",
    categorySlug: "mlb",
    stock: 40,
    soldCount: 300,
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "3ASHC101N-43BGD" },
    variants: [{ name: "Size", options: [{ name: "38", price: 1800000, stock: 10 }] }]
  },
  {
    name: "Jordan 1 Mid 'Smoke Grey' (2Hand)",
    brand: "Jordan",
    slug: "j1-smoke-grey-2hand",
    price: 1850000,
    image: "https://images.stockx.com/images/Air-Jordan-1-Mid-Light-Smoke-Grey-Product.jpg",
    categorySlug: "jordan",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", styleCode: "554724-092" },
    variants: []
  },
  {
    name: "Ultraboost 4.0 'White' (2Hand)",
    brand: "Adidas",
    slug: "ub-white-2hand",
    price: 1200000,
    image: "https://images.stockx.com/images/adidas-Ultra-Boost-4pt0-Triple-White-Product.jpg",
    categorySlug: "adidas",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "90%", accessories: "No Box", styleCode: "BB6168" },
    variants: []
  },
  {
    name: "Nike Air Jordan 1 Low 'Wolf Grey'",
    brand: "Nike",
    slug: "jordan-1-low-wolf-grey",
    price: 4500000,
    originalPrice: 5200000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/1.png",
    description: "Phối màu cực hot dành cho giới trẻ, dễ phối đồ và cực kỳ bền bỉ.",
    categorySlug: "jordan",
    stock: 50,
    soldCount: 3215,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DC0774-105", material: "Leather" },
    variants: [{ name: "Size", options: [{ name: "39", price: 4500000, stock: 15 }] }]
  },
  {
    name: "New Balance 530 'Steel Grey'",
    brand: "New Balance",
    slug: "nb-530-steel-grey",
    price: 2900000,
    originalPrice: 3100000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/4.png",
    description: "Giày chạy bộ phong cách retro, cực kỳ êm ái cho hoạt động hàng ngày.",
    categorySlug: "new-balance",
    stock: 20,
    soldCount: 532,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "MR530KA", material: "Mesh" },
    variants: [{ name: "Size", options: [{ name: "38", price: 2900000, stock: 10 }] }]
  },
  {
    name: "Nike Air Force 1 '07 White",
    brand: "Nike",
    slug: "af1-07-white-clean",
    price: 2600000,
    originalPrice: 2900000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/5.png",
    description: "Huyền thoại của mọi huyền thoại. Trắng tinh khôi, cân mọi outfit.",
    categorySlug: "nike",
    stock: 60,
    soldCount: 342,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "CW2288-111", material: "Leather" },
    variants: [{ name: "Size", options: [{ name: "40", price: 2600000, stock: 20 }] }]
  },
  {
    name: "Jordan 1 High 'Lost and Found' (Reprint)",
    brand: "Jordan",
    slug: "j1-high-lost-found-reprint",
    price: 11500000,
    originalPrice: 13000000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/6.png",
    description: "Siêu phẩm tái hiện vẻ đẹp vintage của năm 1985.",
    categorySlug: "jordan",
    stock: 5,
    soldCount: 4326,
    featured: true,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DZ5485-612", material: "Cracked Leather" },
    variants: [{ name: "Size", options: [{ name: "43", price: 12000000, stock: 1 }] }]
  },
  {
    name: "Adidas Campus 00s 'Core Black'",
    brand: "Adidas",
    slug: "adidas-campus-black",
    price: 2700000,
    originalPrice: 3000000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/7.png",
    description: "Thiết kế mập mạp, đậm chất skating từ những năm 2000.",
    categorySlug: "adidas",
    stock: 14,
    soldCount: 32,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "HQ8708", material: "Suede" },
    variants: [{ name: "Size", options: [{ name: "41", price: 2700000, stock: 5 }] }]
  },
  {
    name: "Nike Dunk Low 'Grey Fog'",
    brand: "Nike",
    slug: "dunk-grey-fog",
    price: 3800000,
    originalPrice: 4200000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/8.png",
    description: "Sự kết hợp tinh tế giữa màu xám sương mù và trắng.",
    categorySlug: "nike",
    stock: 10,
    soldCount: 3215,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DD1391-103", material: "Leather" },
    variants: [{ name: "Size", options: [{ name: "40", price: 3800000, stock: 4 }] }]
  },
  {
    name: "New Balance 2002R 'Protection Pack'",
    brand: "New Balance",
    slug: "nb-2002r-protection",
    price: 4800000,
    originalPrice: 5500000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/9.png",
    description: "Vẻ ngoài bụi bặm, phá cách với các lớp da cắt xẻ.",
    categorySlug: "new-balance",
    stock: 10,
    soldCount: 876,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "M2002RDA", material: "Suede/Mesh" },
    variants: [{ name: "Size", options: [{ name: "42", price: 4800000, stock: 2 }] }]
  },
  {
    name: "MLB Chunky Liner 'New York Yankees'",
    brand: "MLB",
    slug: "mlb-chunky-liner-ny",
    price: 2400000,
    originalPrice: 2800000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/10.png",
    description: "Giày đế cao tôn dáng, phong cách trẻ trung Hàn Quốc.",
    categorySlug: "mlb",
    stock: 15,
    soldCount: 43,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "3ASXCB12N-50WHS", material: "Synthetic Leather" },
    variants: [{ name: "Size", options: [{ name: "37", price: 2400000, stock: 5 }] }]
  },
  {
    name: "Adidas Gazelle Indoor",
    brand: "Adidas",
    slug: "adidas-gazelle-indoor",
    price: 3200000,
    originalPrice: 3520000,
    image: "/uploads/products/adidas Gazelle Indoor.png",
    categorySlug: "adidas",
    stock: 20,
    soldCount: 31,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "841396" },
    variants: [{ name: "Size", options: [{ name: "39", price: 3200000, stock: 8 }] }]
  },
  {
    name: "Adidas Yeezy Boost 350 V2 Carbon Beluga",
    brand: "Adidas",
    slug: "adidas-yeezy-boost-350-v2-carbon-beluga",
    price: 6500000,
    image: "/uploads/products/adidas Yeezy Boost 350 V2 Carbon Beluga.png",
    categorySlug: "yeezy",
    stock: 20,
    soldCount: 5,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "HQ7045" },
    variants: [{ name: "Size", options: [{ name: "41", price: 6500000, stock: 2 }] }]
  },
  {
    name: "Jordan 4 Retro Thunder",
    brand: "Jordan",
    slug: "jordan-4-retro-thunder",
    price: 7200000,
    image: "/uploads/products/Jordan 4 Retro.png",
    categorySlug: "jordan",
    stock: 20,
    soldCount: 142,
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox", styleCode: "DH6927-017" },
    variants: [{ name: "Size", options: [{ name: "41", price: 7200000, stock: 1 }] }]
  },
  {
    name: "Jordan 11 Retro Gratitude",
    brand: "Jordan",
    slug: "jordan-11-retro-gratitude",
    price: 3100000,
    image: "/uploads/products/Jordan 11 Retro.png",
    categorySlug: "jordan",
    stock: 20,
    soldCount: 16,
    isNew: false,
    specs: { condition: "95%", accessories: "Replacement Box", styleCode: "CT8012-170" },
    variants: [{ name: "Size", options: [{ name: "43", price: 3100000, stock: 10 }] }]
  },
  {
    name: "Nike Kobe 6 Protro Reverse Grinch",
    brand: "Nike",
    slug: "nike-kobe-6-protro-reverse-grinch",
    price: 8800000,
    image: "/uploads/products/Nike Kobe 6 Protro.png",
    categorySlug: "nike",
    stock: 20,
    soldCount: 132,
    isNew: false,
    featured: true,
    specs: { condition: "Like New", accessories: "Replacement Box", styleCode: "FV4921-600" },
    variants: [{ name: "Size", options: [{ name: "42", price: 8800000, stock: 10 }] }]
  },
  {
    name: "[2Hand] Nike Air Jordan 1 High 'Shadow'",
    brand: "Jordan",
    slug: "2hand-j1-shadow",
    price: 3500000,
    originalPrice: 6500000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/1.png",
    description: "Độ mới 98%, da còn rất đẹp, đế mòn nhẹ. Giá cực tốt cho một đôi High-top.",
    categorySlug: "jordan",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "98%", accessories: "Replacement Box", styleCode: "555088-013" },
    variants: [{ name: "Size", options: [{ name: "42.5", price: 3500000, stock: 1 }] }]
  },
  {
    name: "[2Hand] Nike Dunk Low 'University Blue'",
    brand: "Nike",
    slug: "2hand-dunk-uniblue",
    price: 2900000,
    originalPrice: 5000000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/2.png",
    description: "Tình trạng 95%, màu xanh sky cực đẹp. Đã vệ sinh sạch sẽ.",
    categorySlug: "nike",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", styleCode: "DD1391-102" },
    variants: [{ name: "Size", options: [{ name: "41", price: 2900000, stock: 1 }] }]
  },
  {
    name: "[2Hand] Adidas Yeezy Boost 350 V2 'Zebra'",
    brand: "Adidas",
    slug: "2hand-yeezy-zebra",
    price: 4200000,
    originalPrice: 9000000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/3.png",
    description: "Độ mới 90%, đế có ố vàng nhẹ theo thời gian (vẻ đẹp vintage). Boost vẫn còn rất êm.",
    categorySlug: "yeezy",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "90%", accessories: "Fullbox", styleCode: "CP9654" },
    variants: [{ name: "Size", options: [{ name: "42", price: 4200000, stock: 1 }] }]
  },
  {
    name: "[2Hand] Converse Chuck 70 High 'Parchment'",
    brand: "Converse",
    slug: "2hand-converse-70s",
    price: 850000,
    originalPrice: 2000000,
    image: "https://raw.githubusercontent.com/VoThanhVinh/img-host/main/sneaker/10.png",
    description: "Độ mới 95%, đế chưa mòn nhiều. Màu kem classic.",
    categorySlug: "converse",
    stock: 1,
    soldCount: 0,
    isNew: false,
    specs: { condition: "95%", accessories: "No Box", styleCode: "162053C" },
    variants: [{ name: "Size", options: [{ name: "41", price: 850000, stock: 1 }] }]
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // 1. Refresh Categories
    await Category.deleteMany({});
    console.log("Cleared old Categories.");

    const categories = [
      { name: "Nike", slug: "nike", description: "Just Do It" },
      { name: "Adidas", slug: "adidas", description: "Impossible is Nothing" },
      { name: "Jordan", slug: "jordan", description: "Jumpman" },
      { name: "New Balance", slug: "new-balance", description: "Fearlessly Independent" },
      { name: "Yeezy", slug: "yeezy", description: "Kanye West" },
      { name: "MLB", slug: "mlb", description: "Major League Baseball" },
      { name: "Vans", slug: "vans", description: "Off The Wall" },
      { name: "Converse", slug: "converse", description: "Chuck Taylor" },
      { name: "Puma", slug: "puma", description: "Forever Faster" },
      { name: "Asics", slug: "asics", description: "Sound Mind, Sound Body" },
      { name: "Timberland", slug: "timberland", description: "Boots" },
      { name: "Onitsuka Tiger", slug: "onitsuka-tiger", description: "Japanese Brand" }
    ];

    await Category.insertMany(categories);
    console.log("Seeded Categories successfully!");

    // 2. Refresh Products (Clear and Re-seed with full list)
    await Product.deleteMany({});
    console.log("Cleared old Products.");
    
    await Product.insertMany(sneakers);
    console.log(`Seeded ${sneakers.length} Products successfully!`);

    console.log("FootMark Pro Seeding Completed!");
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
