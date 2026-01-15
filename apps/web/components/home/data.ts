export const BRANDS = [
  { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
  { name: 'New Balance', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg' },
  { name: 'Puma', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Puma_Logo.png' },
  { name: 'Vans', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Vans-logo.svg' },
  { name: 'Converse', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg' },
];

export const NEW_ARRIVALS = [
  {
    id: 1,
    name: 'Nike Air Force 1 Low',
    brand: 'Nike',
    price: 2800000,
    originalPrice: 0,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    tag: 'Best Seller'
  },
  {
    id: 2,
    name: 'Adidas Forum Low',
    brand: 'Adidas',
    price: 2500000,
    originalPrice: 3000000,
    image: 'https://images.unsplash.com/photo-1587563871167-1ee7c735c32e?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    tag: 'Sale'
  },
  {
    id: 3,
    name: 'NB 530 White Silver',
    brand: 'New Balance',
    price: 2350000,
    originalPrice: 0,
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    tag: 'Trending'
  },
  {
    id: 4,
    name: 'MLB Chunky Liner',
    brand: 'MLB',
    price: 3100000,
    originalPrice: 0,
    image: 'https://images.unsplash.com/photo-1607522370275-f14206c19bd9?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    tag: ''
  },
];

export const SECONDHAND_DEALS = [
  {
    id: 101,
    name: 'Jordan 1 High Chicago (2015)',
    brand: 'Jordan',
    price: 15500000,
    originalPrice: 25000000, // Giá thị trường
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600',
    condition: '98%',
    size: '42',
    accessories: 'Full Box',
    note: 'Đã check legit, box hơi móp'
  },
  {
    id: 102,
    name: 'Yeezy 350 V2 Zebra',
    brand: 'Adidas',
    price: 4200000,
    originalPrice: 8000000,
    image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&q=80&w=600',
    condition: '95%',
    size: '41',
    accessories: 'No Box',
    note: 'Đế hơi ố vàng nhẹ'
  },
  {
    id: 103,
    name: 'Nike Dunk Low Panda',
    brand: 'Nike',
    price: 1800000,
    originalPrice: 3500000,
    image: 'https://images.unsplash.com/photo-1637844527273-21859f9954de?auto=format&fit=crop&q=80&w=600',
    condition: '90%',
    size: '40',
    accessories: 'Rep Box',
    note: 'Crease mũi nhẹ'
  },
  {
    id: 104,
    name: 'Jordan 4 Retro Military Black',
    brand: 'Jordan',
    price: 6800000,
    originalPrice: 9500000,
    image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=600',
    condition: 'Likenew',
    size: '43',
    accessories: 'Full Box',
    note: 'Chỉ mới xỏ thử'
  },
];

export const BLOGS = [
  {
    id: 1,
    title: 'Cách phân biệt Jordan 1 Real vs Fake chuẩn 2026',
    date: '10/01/2026',
    image: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&q=80&w=400',
    desc: 'Những điểm check point quan trọng mà dân buôn không muốn cho bạn biết...'
  },
  {
    id: 2,
    title: 'Vệ sinh giày da lộn (Suede) tại nhà đúng cách',
    date: '08/01/2026',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=400',
    desc: 'Đừng để đôi giày yêu thích của bạn bị hỏng chỉ vì dùng sai bàn chải...'
  },
  {
    id: 3,
    title: 'Top 5 mẫu giày "Cày cuốc" bền bỉ nhất năm nay',
    date: '05/01/2026',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    desc: 'Vừa đẹp, vừa bền, giá lại học sinh sinh viên. Xem ngay danh sách...'
  }
];
