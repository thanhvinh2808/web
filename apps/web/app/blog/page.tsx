"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, Calendar, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- TYPES ---
interface Blog {
  _id: string; // or id
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  readTime: string;
  content?: string;
  createdAt: string; // Use createdAt from MongoDB
  [key: string]: any; // Allow other properties
}


// --- API URL ---
import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

// --- UTILS ---
const calculateReadingTime = (content: string): string => {
  if (!content) return '1 phút đọc';
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} phút đọc`;
};

const formatDate = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
  } catch (error) {
    console.error('Invalid date format:', error);
    return 'Ngày không xác định';
  }
};

// --- BLOG PAGE COMPONENT ---
export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all blogs
        const url = activeCategory === 'Tất cả' 
          ? `${API_URL}/api/blogs`
          : `${API_URL}/api/blogs?category=${activeCategory}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch blogs');
        const data = await response.json();
        
        const blogsWithReadTime = (Array.isArray(data) ? data : []).map((blog: Blog) => ({
          ...blog,
          readTime: calculateReadingTime(blog.content || '')
        }));
        
        setBlogs(blogsWithReadTime);

        // Extract categories once
        if (categories.length === 0) {
          const cats = Array.from(new Set(blogsWithReadTime.map(b => b.category))).filter(Boolean);
          setCategories(['Tất cả', ...cats]);
        }

        // Fetch featured blogs (first time only or when category is 'Tất cả')
        if (featuredBlogs.length === 0) {
          const featResponse = await fetch(`${API_URL}/api/blogs?featured=true&limit=3`);
          if (featResponse.ok) {
            const featData = await featResponse.json();
            setFeaturedBlogs(featData.map((b: Blog) => ({
              ...b,
              readTime: calculateReadingTime(b.content || '')
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [activeCategory]);

  const handleBlogClick = (blog: Blog) => {
    router.push(`/blog/${blog.slug}`);
  };

  if (isLoading && blogs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-10 bg-gray-200 w-1/4 rounded mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          <span className="text-black">Foot</span>
          <span className="text-primary">mark</span> Blog
        </h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto">
          Cập nhật xu hướng sneaker, hướng dẫn bảo quản và câu chuyện đằng sau những biểu tượng.
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      {activeCategory === 'Tất cả' && featuredBlogs.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <h2 className="text-3xl font-bold">Bài viết tiêu điểm</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Featured */}
            <div 
              className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-2xl h-[500px]"
              onClick={() => handleBlogClick(featuredBlogs[0])}
            >
              <img 
                src={featuredBlogs[0].image} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt={featuredBlogs[0].title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8 text-white">
                <span className="bg-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4 inline-block">
                  {featuredBlogs[0].category}
                </span>
                <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {featuredBlogs[0].title}
                </h3>
                <p className="text-gray-300 line-clamp-2 mb-4 text-lg">
                  {featuredBlogs[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><User size={16} /> {featuredBlogs[0].author?.name}</span>
                  <span className="flex items-center gap-1.5"><Clock size={16} /> {featuredBlogs[0].readTime}</span>
                </div>
              </div>
            </div>

            {/* Side Featured */}
            <div className="flex flex-col gap-6">
              {featuredBlogs.slice(1, 3).map(blog => (
                <div 
                  key={blog._id}
                  className="flex gap-6 bg-white p-4 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => handleBlogClick(blog)}
                >
                  <div className="w-40 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                    <img src={blog.image} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" alt={blog.title} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2">{blog.category}</span>
                    <h4 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                       <span className="flex items-center gap-1"><Clock size={12} /> {blog.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Newsletter Small Card */}
              <div className="bg-gray-900 rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h4 className="text-xl font-bold mb-2">Đăng ký bản tin Footmark</h4>
                <p className="text-gray-400 text-sm mb-4">Nhận thông báo về các mẫu giày Secondhand mới nhất vừa cập bến.</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Email của bạn" className="bg-gray-800 border-none rounded-lg px-3 py-2 text-sm flex-1 focus:ring-1 focus:ring-primary" />
                  <button className="bg-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition">Gửi</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gray-800 rounded-full"></div>
              <h2 className="text-3xl font-bold">{activeCategory === 'Tất cả' ? 'Tất cả bài viết' : `Bài viết về ${activeCategory}`}</h2>
           </div>
           <span className="text-gray-500 font-medium">{blogs.length} bài viết</span>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8" role="alert">
            <p className="font-bold">Lỗi!</p>
            <p>{error}</p>
          </div>
        )}

        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map(blog => (
              <article
                key={blog._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-gray-100 flex flex-col"
                onClick={() => handleBlogClick(blog)}
              >
                <div className="relative overflow-hidden h-60 rounded-t-2xl">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                  <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 p-2 rounded-full text-primary shadow-lg">
                      <ArrowLeft className="rotate-180" size={20} />
                    </div>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">{blog.category}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-gray-400 text-xs">{blog.readTime}</span>
                  </div>
                  
                  <h3 className="font-bold text-2xl mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors"> 
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-base">
                    {blog.excerpt}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary font-bold text-xs">
                        {blog.author?.name?.charAt(0) || 'A'}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{blog.author?.name || 'Admin'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(blog.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-24 bg-gray-50 rounded-3xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Clock className="text-gray-400" size={40} />
              </div>
              <p className="text-gray-500 text-xl font-medium">Hiện tại chưa có bài viết nào trong mục này.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}