'use client';
import React from 'react';
import { BLOGS } from './data';
import { Clock } from 'lucide-react';

export default function BlogSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-black text-gray-900 italic uppercase mb-10 text-center">Kiến Thức Sneaker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOGS.map(blog => (
            <article key={blog.id} className="group cursor-pointer">
              <div className="overflow-hidden  mb-4 aspect-video">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock size={14}/> {blog.date}
              </div>
              <h4 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition line-clamp-2">
                {blog.title}
              </h4>
              <p className="text-gray-500 line-clamp-2 text-sm">
                {blog.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
