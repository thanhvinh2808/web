// app/admin/components/BlogForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Blog } from '@/data/blog/types';
import Image from 'next/image';


const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Function to check if a URL is absolute
const isAbsoluteUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};


const createSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
};

interface BlogFormProps {
  blogId?: string | null;
  onFormClose: () => void;
  token: string;
}

export default function BlogForm({ blogId, onFormClose, token }: BlogFormProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(false);
  
  const [loading, setLoading] = useState(false); // For initial data fetch
  const [submitting, setSubmitting] = useState(false); // For form submission/upload

  const isEditing = !!blogId;

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchBlog = async () => {
        try {
          const res = await fetch(`${API_URL}/api/admin/blogs/${blogId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch blog post');
          const data: Blog = await res.json();
          setTitle(data.title);
          setSlug(data.slug);
          setExcerpt(data.excerpt || '');
          setContent(data.content);
          setImage(data.image || '');
          setCategory(data.category || '');
          setTags(data.tags || []);
          setPublished(data.published || false);
        } catch (err: any) {
          toast.error(err.message || 'Error fetching blog post.');
          onFormClose();
        } finally {
          setLoading(false);
        }
      };
      fetchBlog();
    }
  }, [blogId, isEditing, token, onFormClose]);


  useEffect(() => {
    if (!isEditing) {
      setSlug(createSlug(title));
    }
  }, [title, isEditing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/api/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to upload image');
      const data = await res.json();
      setImage(data.data.url);
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error uploading image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing ? `${API_URL}/api/admin/blogs/${blogId}` : `${API_URL}/api/admin/blogs`;
      const method = isEditing ? 'PUT' : 'POST';

      const body = JSON.stringify({
        title, slug, content, image, category, tags, published,
        excerpt: excerpt || content.substring(0, 150).replace(/<[^>]*>?/gm, ''),
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body,
      });

      if (!res.ok) throw new Error((await res.json()).message || `Failed to ${isEditing ? 'update' : 'create'} blog post`);
      
      toast.success(`Blog post ${isEditing ? 'updated' : 'created'} successfully!`);
      onFormClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onFormClose} className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          <ChevronLeft size={20} className="mr-2" /> Quay lại danh sách
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Chỉnh sửa Bài viết' : 'Thêm Bài viết mới'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Form fields are the same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input type="text" id="slug" value={slug} onChange={(e) => setSlug(createSlug(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50" readOnly={!isEditing} />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
          <textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
          <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
          <div className="flex items-center space-x-4">
            <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={submitting} />
            {image && <Image src={isAbsoluteUrl(image) ? image : `${API_URL}${image}`} alt="Preview" width={96} height={96} className="object-cover rounded-md border" />}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thẻ (Tags)</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Nhập thẻ và nhấn Enter"/>
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Thêm</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="flex-shrink-0 ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200">
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8"><path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" /></svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center mb-6">
          <input type="checkbox" id="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="published" className="ml-2 block text-sm font-medium text-gray-700">Xuất bản ngay</label>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" /> : <Save className="-ml-1 mr-3 h-5 w-5" />}
            {isEditing ? 'Lưu thay đổi' : 'Tạo Bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}
