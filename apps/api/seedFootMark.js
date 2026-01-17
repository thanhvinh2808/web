// apps/api/seedFootMark.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

const categories = [
  { name: "Nike", slug: "nike", icon: "👟", description: "Thương hiệu giày thể thao hàng đầu thế giới." },
  { name: "Jordan", slug: "jordan", icon: "🏀", description: "Dòng giày bóng rổ huyền thoại từ Nike." },
  { name: "Adidas", slug: "adidas", icon: "⚽", description: "Sự kết hợp hoàn hảo giữa hiệu năng và thời trang." },
  { name: "New Balance", slug: "new-balance", icon: "🏙️", description: "Đẳng cấp từ sự êm ái và phong cách retro." },
  { name: "Yeezy", slug: "yeezy", icon: "☁️", description: "Sự sáng tạo đột phá từ Kanye West và Adidas." },
  { name: "Puma", slug: "puma", icon: "🐆", description: "Phong cách thể thao mạnh mẽ và năng động." }
];

const products = [
  {
    name: "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
    brand: "Jordan",
    slug: "jordan-1-chicago-lost-and-found",
    price: 12500000,
    originalPrice: 15000000,
    image: "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Lost-and-Found-Product.jpg",
    description: "Phối màu huyền thoại Chicago quay trở lại với diện mạo vintage cổ điển.",
    categorySlug: "jordan",
    stock: 5,
    isNew: true,
    specs: {
      condition: "New",
      accessories: "Fullbox, Extra Laces",
      material: "Leather",
      styleCode: "DZ5485-612",
      colorway: "Varsity Red/Black/Sail/Muslin"
    }
  },
  {
    name: "Nike Dunk Low 'Panda' (2021/2022)",
    brand: "Nike",
    slug: "nike-dunk-low-panda",
    price: 3200000,
    originalPrice: 4500000,
    image: "https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg",
    description: "Đôi giày quốc dân dễ phối đồ nhất mọi thời đại.",
    categorySlug: "nike",
    stock: 12,
    isNew: true,
    specs: {
      condition: "New",
      accessories: "Fullbox",
      material: "Leather",
      styleCode: "DD1391-100",
      colorway: "White/Black"
    }
  },
  {
    name: "New Balance 550 'White Green'",
    brand: "New Balance",
    slug: "nb-550-white-green-2hand",
    price: 1850000,
    originalPrice: 3800000,
    image: "https://images.stockx.com/images/New-Balance-550-White-Green-Product.jpg",
    description: "Hàng 2Hand tuyển chọn, độ mới cao, đế cực êm.",
    categorySlug: "new-balance",
    stock: 1,
    isNew: false,
    specs: {
      condition: "95%",
      accessories: "No Box (Replacement Box)",
      material: "Leather/Suede",
      styleCode: "BB550WT1",
      colorway: "White/Green"
    }
  },
  {
    name: "Adidas Yeezy Boost 350 V2 'Slate'",
    brand: "Yeezy",
    slug: "yeezy-350-v2-slate",
    price: 5800000,
    originalPrice: 7500000,
    image: "https://images.stockx.com/images/Adidas-Yeezy-Boost-350-V2-Slate-Product.jpg",
    description: "Công nghệ đế Boost êm ái cùng phối màu Slate cực sang.",
    categorySlug: "yeezy",
    stock: 3,
    isNew: true,
    specs: {
      condition: "New",
      accessories: "Fullbox",
      material: "Primeknit",
      styleCode: "HP7870",
      colorway: "Slate/Core Black"
    }
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Clear old data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared old Categories and Products.");

    // Seed Categories
    await Category.insertMany(categories);
    console.log("Seeded Categories successfully.");

    // Seed Products
    await Product.insertMany(products);
    console.log("Seeded Products successfully.");

    console.log("FootMark Seeding Completed!");
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
