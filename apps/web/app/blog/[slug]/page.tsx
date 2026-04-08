"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, User, Calendar, Share2, Facebook, Twitter, Link as LinkIcon, ChevronRight } from "lucide-react";
import DOMPurify from 'isomorphic-dompurify';

// --- TYPES ---
interface Blog {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  createdAt?: string;
  readTime?: string;
  content: string;
  tags?: string[];
  views?: number;
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

// --- BLOG DETAIL PAGE COMPONENT ---
export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  // Scroll Progress Logic
  useEffect(() => {
    const updateReadingProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setReadingProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
      }
    };

    window.addEventListener("scroll", updateReadingProgress);
    return () => window.removeEventListener("scroll", updateReadingProgress);
  }, []);

  useEffect(() => {
    if (!slug) return;

    const fetchBlogDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/blogs/${slug}`);
        if (!response.ok) throw new Error('Blog not found');

        const data: Blog = await response.json();
        
        // Calculate read time on client if not provided
        if (!data.readTime) {
          data.readTime = calculateReadingTime(data.content);
        }
        
        setBlog(data);

        // Fetch related blogs (same category)
        if (data.category) {
          const relatedResponse = await fetch(`${API_URL}/api/blogs?category=${data.category}&limit=4`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
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

  const handleShare = (platform: 'fb' | 'tw' | 'copy') => {
    const url = window.location.href;
    if (platform === 'fb') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    } else if (platform === 'tw') {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${blog?.title}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      // Small feedback would be nice, but skipping toast as per your preference
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl animate-pulse">
        <div className="h-4 bg-gray-200 w-24 mb-8 rounded"></div>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3">
            <div className="h-12 bg-gray-200 w-full mb-6 rounded"></div>
            <div className="h-6 bg-gray-200 w-1/2 mb-12 rounded"></div>
            <div className="h-[400px] bg-gray-200 w-full mb-8 rounded-2xl"></div>
          </div>
          <div className="lg:w-1/3">
            <div className="h-80 bg-gray-200 w-full rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">{error || 'Bài viết không tồn tại'}</h2>
        <button onClick={() => router.push('/blog')} className="text-primary font-semibold flex items-center gap-2 mx-auto hover:underline">
          <ArrowLeft size={20} /> Quay lại Blog
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1.5 bg-primary z-50 transition-all duration-150" 
        style={{ width: `${readingProgress}%` }}
      ></div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Breadcrumb & Back */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/')}>Trang chủ</span>
          <ChevronRight size={14} />
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/blog')}>Blog</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium truncate">{blog.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Article Section */}
          <main className="lg:w-2/3">
            {/* Header */}
            <header className="mb-10">
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                {blog.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-8 leading-[1.15]">
                {blog.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {blog.author?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{blog.author?.name || 'Admin'}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(blog.createdAt || '').toLocaleDateString('vi-VN')}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {blog.readTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => handleShare('fb')} className="p-2.5 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Facebook size={18} />
                  </button>
                  <button onClick={() => handleShare('tw')} className="p-2.5 rounded-full bg-gray-50 text-gray-600 hover:bg-black hover:text-white transition-all shadow-sm">
                    <Twitter size={18} />
                  </button>
                  <button onClick={() => handleShare('copy')} className="p-2.5 rounded-full bg-gray-50 text-gray-600 hover:bg-primary hover:text-white transition-all shadow-sm">
                    <LinkIcon size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="mb-12">
              <img 
                src={blog.image} 
                alt={blog.title} 
                className="w-full h-auto rounded-3xl shadow-2xl object-cover max-h-[600px]"
              />
            </div>

            {/* Blog Content */}
            <article className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-2xl">
              {/* Excerpt as Intro */}
              <p className="lead text-2xl font-medium text-gray-600 mb-10 pb-8 border-b italic">
                "{blog.excerpt}"
              </p>

              {/* Main Content Sanitized */}
              <div 
                className="content-body"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }} 
              />
            </article>

            {/* Tags & Footer */}
            <div className="mt-16 pt-8 border-t">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gray-900 font-bold mr-2">Tags:</span>
                {blog.tags?.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-1/3">
            <div className="sticky top-24 space-y-12">
              {/* Related Posts */}
              {relatedBlogs.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    Bài viết liên quan
                  </h3>
                  <div className="space-y-6">
                    {relatedBlogs.map(rb => (
                      <div 
                        key={rb._id} 
                        className="flex gap-4 group cursor-pointer"
                        onClick={() => router.push(`/blog/${rb.slug}`)}
                      >
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl">
                          <img src={rb.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rb.title} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                            {rb.title}
                          </h4>
                          <span className="text-xs text-gray-400">{rb.readTime || '3 phút đọc'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Newsletter Box */}
              <section className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 leading-tight">Gia nhập cộng đồng Footmark</h3>
                  <p className="text-gray-400 text-sm mb-6">Đăng ký để nhận những bài viết về phối đồ, bảo quản giày và săn deal độc quyền.</p>
                  <form className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Email của bạn..." 
                      className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                    />
                    <button className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                      Đăng ký ngay
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-500 mt-4 text-center">Chúng tôi cam kết không spam. Bạn có thể hủy đăng ký bất cứ lúc nào.</p>
                </div>
              </section>

              {/* AD/CTA Card */}
              <section className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8 border border-primary/20">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Săn giày Secondhand?</h3>
                <p className="text-gray-600 text-sm mb-6">Hàng trăm mẫu Sneaker tuyển chọn đang đợi bạn.</p>
                <button 
                  onClick={() => router.push('/products')}
                  className="flex items-center justify-center gap-2 w-full bg-white text-primary border border-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  Khám phá ngay <ChevronRight size={18} />
                </button>
              </section>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="bg-gray-50 py-20 mt-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Bạn thấy bài viết này hữu ích?</h2>
          <p className="text-gray-600 mb-8">Hãy chia sẻ nó với bạn bè hoặc để lại bình luận để chúng tôi biết ý kiến của bạn nhé!</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => handleShare('fb')}
              className="flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg"
            >
              <Facebook size={20} /> Facebook
            </button>
            <button 
              onClick={() => handleShare('copy')}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg"
            >
              <LinkIcon size={20} /> Sao chép Link
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}