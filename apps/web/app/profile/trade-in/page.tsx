"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Clock, CheckCircle, XCircle, Info, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;

interface TradeInRequest {
  _id: string;
  productName: string;
  brand: string;
  condition: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  expectedPrice: number;
  finalPrice?: number;
  adminNote?: string;
  images: string[];
  createdAt: string;
}

export default function TradeInHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<TradeInRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/trade-in/my-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRequests(data.data);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử Trade-In:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-50 text-yellow-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-yellow-100 flex items-center gap-1"><Clock size={12}/> Chờ duyệt</span>;
      case 'approved':
        return <span className="bg-blue-50 text-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1"><CheckCircle size={12}/> Đã định giá</span>;
      case 'completed':
        return <span className="bg-green-50 text-green-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1"><CheckCircle size={12}/> Hoàn thành</span>;
      case 'rejected':
        return <span className="bg-red-50 text-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-1"><XCircle size={12}/> Đã từ chối</span>;
      default:
        return <span className="bg-gray-50 text-gray-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-gray-100">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gray-100 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black italic text-gray-800 uppercase tracking-tighter">Lịch sử Trade-In</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi các yêu cầu thu cũ đổi mới của bạn</p>
        </div>
        <Link href="/trade-in" className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition">
          Gửi yêu cầu mới
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Package className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Bạn chưa có yêu cầu Trade-In nào</p>
          <Link href="/trade-in" className="text-primary text-xs font-black uppercase tracking-widest mt-4 inline-block hover:underline italic">Bắt đầu ký gửi ngay &rarr;</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req._id} className="border border-gray-100 bg-white hover:border-gray-300 transition-all shadow-sm overflow-hidden group">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Gallery Preview */}
                  <div className="w-full md:w-32 h-32 bg-gray-50 border border-gray-100 flex-shrink-0 relative overflow-hidden">
                    {req.images && req.images.length > 0 ? (
                      <img 
                        src={req.images[0].startsWith('http') ? req.images[0] : `${API_URL}${req.images[0]}`} 
                        alt={req.productName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    {req.images && req.images.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5">
                        +{req.images.length - 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-black text-lg italic uppercase tracking-tighter text-gray-900 leading-none mb-2">{req.productName}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{req.brand} • Tình trạng: {req.condition}</p>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-y border-gray-50">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá mong muốn</p>
                        <p className="font-bold text-sm italic">{req.expectedPrice.toLocaleString()}₫</p>
                      </div>
                      {req.finalPrice !== undefined && (
                        <div>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Giá FootMark đề xuất</p>
                          <p className="font-black text-primary text-sm italic">{req.finalPrice.toLocaleString()}₫</p>
                        </div>
                      )}
                    </div>

                    {req.adminNote && (
                      <div className="mt-4 p-3 bg-blue-50/50 border-l-2 border-blue-500 flex gap-2">
                        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0"/>
                        <div>
                          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Phản hồi từ FootMark</p>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{req.adminNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50/50 px-6 py-2 border-t border-gray-50 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gửi ngày: {new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: #{req._id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
