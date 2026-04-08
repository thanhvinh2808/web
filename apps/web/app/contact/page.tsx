"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

// --- TYPES ---
interface ContactForm {
  name: string,
  email: string,
  message: string,
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

// --- CONTACT PAGE COMPONENT ---
export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('');

    try {
      console.log('📤 Sending contact form:', formData);
      console.log('🌐 API URL:', `${API_URL}/contacts`);

      const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);

      // Đọc response body
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        // Hiển thị lỗi từ backend
        const errorMessage = data.error || data.message || 'Không thể gửi tin nhắn';
        throw new Error(errorMessage);
      }

      setStatus('success');
      setStatusMessage(data.message || 'Gửi tin nhắn thành công!');
      setFormData({ name: '', email: '', message: '' });

      // Tự động ẩn thông báo thành công sau 5 giây
      setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 5000);

    } catch (error) {
      console.error("❌ Error sending contact:", error);
      setStatus('error');
      
      // Hiển thị lỗi chi tiết
      if (error instanceof Error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau!');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Liên hệ với chúng tôi</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đừng ngần ngại gửi cho chúng tôi bất kỳ câu hỏi nào.
          </p>
        </div>

        {/* Debug Info - Xóa sau khi fix xong */}
        {/* <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">🔍 Debug Info:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <div><strong>API URL:</strong> {API_URL}/contacts</div>
            <div><strong>Status:</strong> {status}</div>
          </div>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Contact Info Column (2/5 width on large screens) */}
          <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Thông tin liên hệ</h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                  <Phone className="text-blue-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Hotline</h4>
                  <p className="text-gray-600 hover:text-blue-600 transition-colors">
                    <a href="tel:1900xxxx">1900 xxxx</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                  <Mail className="text-purple-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                  <p className="text-gray-600 hover:text-purple-600 transition-colors break-all">
                    <a href="mailto:support@footmark.vn">support@footmark.vn</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-pink-100 p-3 rounded-xl flex-shrink-0">
                   <MapPin className="text-pink-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Địa chỉ</h4>
                  <p className="text-gray-600">
                    123 Nguyễn Huệ, Quận 1, TP.HCM
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                   <Clock className="text-green-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Giờ làm việc</h4>
                  <p className="text-gray-600">8:00 - 22:00 hàng ngày</p>
                  <p className="text-sm text-gray-500 mt-1">(Kể cả Thứ 7, CN và ngày lễ)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column (3/5 width on large screens) */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Gửi tin nhắn cho chúng tôi</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Nguyễn Văn A"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="example@email.com"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tin nhắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                  placeholder="Bạn cần hỗ trợ gì?"
                  required
                  disabled={status === 'loading'}
                />
              </div>

              {/* Status Messages */}
              {status === 'success' && (
                <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 animate-fadeIn flex items-center">
                   <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                   {statusMessage}
                </div>
              )}
              {status === 'error' && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 animate-fadeIn">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Lỗi khi gửi tin nhắn</p>
                      <p className="text-sm">{statusMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]
                  ${status === 'loading' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-lg'
                  }`}
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi tin nhắn ngay'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
