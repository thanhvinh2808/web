'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, HelpCircle, ArrowRight, RefreshCw, Truck, Wallet, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function TradeInPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    productName: '',
    brand: 'nike',
    condition: 'new-99',
    note: ''
  });

  // Effect to handle redirection if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        sessionStorage.setItem('redirectAfterLogin', '/trade-in');
        toast.error('Vui lòng đăng nhập để sử dụng tính năng Trade-In');
        router.push('/login');
    } else if (user) {
        setFormData(prev => ({
            ...prev,
            name: user.name || '',
            phone: user.phone || ''
        }));
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          
          if (selectedFiles.length + newFiles.length > 5) {
              toast.error('Chỉ được tải lên tối đa 5 ảnh');
              return;
          }

          setSelectedFiles(prev => [...prev, ...newFiles]);

          // Create preview URLs
          const newPreviews = newFiles.map(file => URL.createObjectURL(file));
          setPreviewUrls(prev => [...prev, ...newPreviews]);
      }
  };

  // Remove file
  const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      setPreviewUrls(prev => {
          // Revoke URL to prevent memory leak
          URL.revokeObjectURL(prev[index]);
          return prev.filter((_, i) => i !== index);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    
    if (selectedFiles.length === 0) {
        toast.error('Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm');
        return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('productName', formData.productName);
      data.append('brand', formData.brand);
      data.append('condition', formData.condition);
      data.append('note', formData.note);
      if (user?.id) data.append('userId', user.id);
      
      selectedFiles.forEach(file => {
          data.append('images', file);
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trade-in`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: data // Sending FormData, so Content-Type header is auto-set
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ sớm.');
        // Reset form
        setFormData({
            name: user?.name || '',
            phone: user?.phone || '',
            productName: '',
            brand: 'nike',
            condition: 'new-99',
            note: ''
        });
        setSelectedFiles([]);
        setPreviewUrls([]);
      } else {
        toast.error(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-black mb-4" size={48} />
            <p className="text-gray-500">Đang kiểm tra đăng nhập...</p>
        </div>
      );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative bg-black text-white overflow-hidden rounded-bl-[4rem]">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=2000" 
             className="w-full h-full object-cover" 
             alt="Sneaker Background"
           />
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-yellow-400 text-black font-bold text-sm mb-6 uppercase tracking-wider">
            Chương trình độc quyền
          </span>
          <h1 className="text-4xl md:text-6xl font-black italic mb-6">
            THU CŨ ĐỔI MỚI <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              LÊN ĐỜI SNEAKER
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Đừng để những đôi giày cũ nằm phủ bụi. Mang chúng đến FootMark để nhận voucher giảm giá lên đến 30% cho đôi giày mơ ước tiếp theo của bạn.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => document.getElementById('valuation-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition flex items-center gap-2"
            >
              Định Giá Ngay <ArrowRight size={20} />
            </button>
            <Link href="/products" className="px-8 py-3 rounded-full font-bold border border-white hover:bg-white/10 transition">
              Xem Giày Mới
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { 
              icon: <RefreshCw size={32} className="text-blue-600" />, 
              title: "1. Gửi Thông Tin", 
              desc: "Điền thông tin và hình ảnh giày cũ của bạn vào form bên dưới." 
            },
            { 
              icon: <Wallet size={32} className="text-green-600" />, 
              title: "2. Nhận Định Giá", 
              desc: "Chuyên gia FootMark sẽ kiểm tra và báo giá thu mua trong vòng 2h." 
            },
            { 
              icon: <Truck size={32} className="text-purple-600" />, 
              title: "3. Đổi Giày Mới", 
              desc: "Nhận voucher hoặc tiền mặt và rước ngay đôi giày mới về nhà." 
            }
          ].map((step, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form */}
          <div id="valuation-form" className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-8 bg-black rounded-full"></div>
                <h2 className="text-3xl font-black italic uppercase">Form Định Giá</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition bg-gray-50"
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                    <input 
                      type="tel" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition bg-gray-50"
                      placeholder="0912 xxx xxx"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm giày</label>
                     <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition bg-gray-50"
                        placeholder="Ví dụ: Nike Air Jordan 1 High..."
                        value={formData.productName}
                        onChange={e => setFormData({...formData, productName: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Thương hiệu</label>
                     <select 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition bg-gray-50 appearance-none"
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                     >
                        <option value="nike">Nike</option>
                        <option value="adidas">Adidas</option>
                        <option value="jordan">Jordan</option>
                        <option value="newbalance">New Balance</option>
                        <option value="converse">Converse</option>
                        <option value="other">Khác</option>
                     </select>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng giày (Ước lượng)</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { val: 'new-99', label: 'Like New (98-99%)' },
                        { val: 'good-90', label: 'Tốt (90-95%)' },
                        { val: 'used-80', label: 'Khá (80-85%)' },
                        { val: 'old', label: 'Cũ (< 80%)' },
                      ].map((opt) => (
                        <label key={opt.val} className={`
                           cursor-pointer border rounded-xl p-3 text-center text-sm font-medium transition
                           ${formData.condition === opt.val ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'}
                        `}>
                           <input 
                              type="radio" 
                              name="condition" 
                              value={opt.val} 
                              className="hidden"
                              checked={formData.condition === opt.val}
                              onChange={e => setFormData({...formData, condition: e.target.value})}
                           />
                           {opt.label}
                        </label>
                      ))}
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm (Tối đa 5 ảnh)</label>
                  
                  {/* File Input Area */}
                  <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition cursor-pointer group">
                     <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                     />
                     <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="text-gray-400 group-hover:text-black" size={32} />
                     </div>
                     <p className="text-sm text-gray-500 font-medium">Kéo thả hoặc Click để tải ảnh lên</p>
                     <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
                  </div>

                  {/* Preview Area */}
                  {previewUrls.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                          {previewUrls.map((url, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                  <button 
                                      type="button"
                                      onClick={() => removeFile(idx)}
                                      className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition"
                                  >
                                      <X size={12} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú thêm</label>
                   <textarea 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition bg-gray-50 h-32 resize-none"
                      placeholder="Mô tả thêm về lỗi, phụ kiện đi kèm (box, dây giày...)"
                      value={formData.note}
                      onChange={e => setFormData({...formData, note: e.target.value})}
                   ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black text-white font-black uppercase text-lg py-4 rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                   {loading ? <Loader2 className="animate-spin" /> : 'Gửi Yêu Cầu Định Giá'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-blue-50 p-6 rounded-3xl">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                   <HelpCircle size={24} /> Tại sao chọn FootMark?
                </h3>
                <ul className="space-y-4">
                   {[
                      "Định giá cao nhất thị trường",
                      "Thu mua tận nhà tại TP.HCM & HN",
                      "Tiền về tài khoản trong 5 phút",
                      "Hỗ trợ đổi giày (Trade-in) trợ giá 15%"
                   ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                         <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" />
                         <span className="text-sm font-medium text-gray-700">{item}</span>
                      </li>
                   ))}
                </ul>
             </div>

             <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
                <h3 className="font-bold text-xl mb-2">Lưu ý quan trọng</h3>
                <p className="text-sm text-gray-600 mb-4">
                   Để được định giá chính xác nhất, vui lòng chụp rõ:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500 text-center">
                   <div className="bg-white p-2 rounded-lg">Góc nghiêng</div>
                   <div className="bg-white p-2 rounded-lg">Mũi giày</div>
                   <div className="bg-white p-2 rounded-lg">Đế giày</div>
                   <div className="bg-white p-2 rounded-lg">Tem size</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}