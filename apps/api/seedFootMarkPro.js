// apps/api/seedFootMarkPro.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const sneakers = [
  // --- BEST SELLERS (Bán chạy - SoldCount cao) ---
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
    soldCount: 1250, // Rất cao
    isNew: false, // Không còn mới
    specs: { condition: "New", accessories: "Fullbox" },
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
    soldCount: 890, // Cao
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox" },
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
    soldCount: 5000, // Huyền thoại bán chạy
    isNew: false,
    specs: { condition: "New", accessories: "Fullbox" },
    variants: [{ name: "Size", options: [{ name: "42", price: 2800000, stock: 20 }] }]
  },

  // --- NEW ARRIVALS (Hàng mới về - SoldCount thấp) ---
  {
    name: "Air Jordan 1 High 'Chicago Lost & Found'",
    brand: "Jordan",
    slug: "jordan-1-chicago-lost-and-found",
    price: 12500000,
    image: "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Lost-and-Found-Product.jpg",
    description: "Siêu phẩm vừa cập bến.",
    categorySlug: "jordan",
    stock: 20,
    soldCount: 5, // Mới bán được ít
    isNew: true, // Hàng mới
    featured: true,
    specs: { condition: "New", accessories: "Fullbox" },
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
    specs: { condition: "New", accessories: "Fullbox" },
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
    specs: { condition: "New", accessories: "Fullbox" },
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
    soldCount: 50, // Bán tàm tạm
    isNew: true,
    specs: { condition: "New", accessories: "Fullbox" },
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
    specs: { condition: "New", accessories: "Fullbox" },
    variants: [{ name: "Size", options: [{ name: "38", price: 1800000, stock: 10 }] }]
  },
  
  // --- 2HAND ---
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
    specs: { condition: "95%", accessories: "No Box" },
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
    specs: { condition: "90%", accessories: "No Box" },
    variants: []
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Clear old products
    await Product.deleteMany({});
    console.log("Cleared old Products.");

    // Seed Products
    await Product.insertMany(sneakers);
    console.log("Seeded Products successfully!");

    console.log("FootMark Pro Seeding Completed!");
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();