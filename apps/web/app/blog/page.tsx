"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, Calendar } from "lucide-react";

// --- TYPES ---
interface Blog {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  content?: string;
}

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// --- BLOG PAGE COMPONENT ---
export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/blogs`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        
        const data = await response.json();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleBlogClick = (blog: Blog) => {
    // Sử dụng slug thay vì id để navigate
    router.push(`/api/blogs/${blog.slug}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Blog công nghệ</h1>
        <p className="text-gray-600 mb-12">Cập nhật tin tức và đánh giá sản phẩm mới nhất</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog công nghệ</h1>
        <p className="text-gray-600 text-lg">Cập nhật tin tức và đánh giá sản phẩm mới nhất</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {/* Blog Grid */}
      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map(blog => (
            <article 
              key={blog.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all group cursor-pointer"
              onClick={() => handleBlogClick(blog)}
            >
              {/* Blog Image */}
              <div className="relative overflow-hidden h-48 bg-gray-100">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                {blog.category && (
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {blog.category}
                  </div>
                )}
              </div>

              {/* Blog Content */}
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-blue-600 transition">
                  {blog.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{blog.author || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{blog.readTime || '5 phút đọc'}</span>
                  </div>
                </div>
                
                {blog.date && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{blog.date}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
        </div>
      )}

      {/* Newsletter Section */}
      <section className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Đăng ký nhận tin tức</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Nhận những bài viết mới nhất và ưu đãi đặc biệt trực tiếp vào email của bạn
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition">
            Đăng ký
          </button>
        </div>
      </section>
    </div>
  );
}