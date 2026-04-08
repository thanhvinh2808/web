'use client';
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { CLEAN_API_URL as API_URL } from '@lib/shared/constants';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  publishedAt: string;
}

export default function BlogSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/blogs?limit=3`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setBlogs(data.slice(0, 3));
        } else if (data && data.data && Array.isArray(data.data)) {
          setBlogs(data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Lỗi tải bài viết trang chủ:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (isLoading) return null;
  if (blogs.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-black text-gray-900 italic uppercase mb-10 text-center">Kiến Thức Sneaker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map(blog => (
            <Link key={blog._id} href={`/blog/${blog.slug}`} className="group block cursor-pointer">
              <article>
                <div className="overflow-hidden mb-4 aspect-video">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock size={14}/> {new Date(blog.publishedAt).toLocaleDateString('vi-VN')}
                </div>
                <h4 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition line-clamp-2 uppercase">
                  {blog.title}
                </h4>
                <p className="text-gray-500 line-clamp-2 text-sm">
                  {blog.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
