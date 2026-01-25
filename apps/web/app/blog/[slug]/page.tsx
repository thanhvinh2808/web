"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, User, Calendar, Share2 } from "lucide-react";

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
  content: string;
}

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- BLOG DETAIL PAGE COMPONENT ---
export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchBlogDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Sửa endpoint: Bỏ /blog/ ở giữa
        const response = await fetch(`${API_URL}/blog/${slug}`);

        if (!response.ok) {
          throw new Error('Blog not found');
        }

        const data = await response.json();
        setBlog(data);

        // Fetch related blogs (optional)
        if (data.category) {
          const relatedResponse = await fetch(
            `${API_URL}/blog/${slug}`
          );
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            // Filter out current blog and limit to 3
            setRelatedBlogs(
              Array.isArray(relatedData)
                ? relatedData.filter((b: Blog) => b.slug !== slug).slice(0, 3)
                : []
            );
          }
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Không tìm thấy bài viết. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogDetail();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link đã được sao chép!');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          {error || 'Không tìm thấy bài viết'}
        </div>
        <button
          onClick={() => router.push('/blog')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft size={20} />
          Quay lại trang blog
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/blog')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition"    
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* Article Header */}
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Category Badge */}
          {blog.category && (
            <div className="px-8 pt-8">
              <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
                {blog.category}
              </span>
            </div>
          )}

          {/* Title */}
          <header className="px-8 pt-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 pb-6 border-b">
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{blog.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{blog.readTime}</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 ml-auto text-blue-600 hover:text-blue-700 transition"  
              >
                <Share2 size={18} />
                <span className="font-medium">Chia sẻ</span>
              </button>
            </div>
          </header>

          {/* Featured Image */}
          <div className="px-8 py-8">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-auto rounded-xl object-cover max-h-[500px]"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23ddd" width="800" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Article Content */}
          <div className="px-8 pb-8">
            <div className="prose prose-lg max-w-none">
              {/* Excerpt */}
              <p className="text-xl text-gray-700 leading-relaxed mb-6 font-medium">
                {blog.excerpt}
              </p>

              {/* Main Content */}
              <div className="text-gray-700 leading-relaxed space-y-4">
                {blog.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Tags/Categories */}
            <div className="mt-8 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                <span className="text-gray-600 font-medium">Tags:</span>
                {blog.category && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    #{blog.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <article
                  key={relatedBlog.id}
                  onClick={() => router.push(`/blog/${relatedBlog.slug}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={relatedBlog.image}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {relatedBlog.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{relatedBlog.readTime}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}