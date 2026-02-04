// app/admin/components/BlogsTab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { Blog } from '@/data/blog/types';
import toast from 'react-hot-toast';
import Image from 'next/image';
import BlogForm from './BlogForm'; // Import the new form component


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Function to check if a URL is absolute
const isAbsoluteUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};


interface BlogsTabProps {
  token: string;
  showMessage: (msg: string) => void;
}

export default function BlogsTab({ token, showMessage }: BlogsTabProps) {
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error('No authentication token found.');

      const query = new URLSearchParams({ pageNumber: currentPage.toString() });
      if (searchTerm) query.append('search', searchTerm);

      const res = await fetch(`${API_URL}/api/admin/blogs?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch blogs');
      
      const data = await res.json();
      setBlogs(data.blogs);
      setCurrentPage(data.page);
      setTotalPages(data.pages);
    } catch (err: any) {
      const msg = err.message || 'Error fetching blogs';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm]);

  useEffect(() => {
    if (view === 'list') {
      fetchBlogs();
    }
  }, [view, fetchBlogs]);

  const handleFormClose = () => {
    setView('list');
    setEditingId(null);
    // The useEffect above will trigger a re-fetch
  };

  const handleAddNew = () => {
    setEditingId(null);
    setView('new');
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này không?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete blog');
      toast.success('Blog post deleted successfully!');
      fetchBlogs(); // Re-fetch
    } catch (err: any) {
      toast.error(err.message || 'Error deleting blog post.');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={`px-4 py-2 rounded-md ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >{index + 1}</button>
        ))}
      </div>
    );
  };
  
  if (view === 'new' || view === 'edit') {
    return <BlogForm token={token} blogId={editingId} onFormClose={handleFormClose} />;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        {/* Title is handled by the main page */}
        <div></div>
        <button onClick={handleAddNew} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors">
          <Plus size={20} className="mr-2" /> Thêm Bài viết mới
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : error ? (
        <div className="text-center text-red-500 py-10 text-lg">{error}</div>
      ) : blogs.length === 0 ? (
        <div className="text-center text-gray-600 py-10 text-lg">Không có bài viết nào.</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thể loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã xuất bản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blogs.map((blog: any) => (
                <tr key={blog._id}>
                  <td className="px-6 py-4"><div className="w-16 h-10 relative"><Image src={isAbsoluteUrl(blog.image) ? blog.image : `${API_URL}${blog.image}`} alt={blog.title} layout="fill" className="object-cover rounded-md"/></div></td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{blog.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.category || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.published ? '✅' : '❌'}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => handleEdit(blog._id)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(blog._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {renderPagination()}
    </div>
  );
}
