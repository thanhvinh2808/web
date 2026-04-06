"use client";

import { useState, useEffect } from 'react';
import { Ticket, Copy, CheckCircle, Clock, Info, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  maxDiscount: number;
  minOrderValue: number;
  endDate: string;
  isActive: boolean;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // Sử dụng endpoint public /api/voucher (theo file route đã check)
        const res = await fetch(`${API_URL}/api/voucher`);
        const data = await res.json();
        
        if (data.success) {
          setVouchers(data.data);
        } else {
          // Fallback nếu API trả về mảng trực tiếp (tùy implementation cũ)
          if (Array.isArray(data)) setVouchers(data);
        }
      } catch (error) {
        console.error("Lỗi tải voucher:", error);
        toast.error("Không thể tải danh sách mã giảm giá");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const calculateTimeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "Đã hết hạn";
    if (days === 0) {
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Hết hạn trong ${hours} giờ`;
    }
    return `Hết hạn sau ${days} ngày`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="animate-fade-in">
      <div className="border-b border-gray-100 pb-4 mb-8">
        <h1 className="text-xl font-medium text-gray-800 uppercase tracking-wide flex items-center gap-2">
           <Ticket className="text-orange-500" /> Kho Voucher
        </h1>
        <p className="text-sm text-gray-500 mt-1">Săn mã giảm giá độc quyền từ FootMark</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tìm ưu đãi...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <Ticket size={40} className="text-orange-300" />
          </div>
          <h3 className="text-gray-900 font-bold uppercase tracking-wider">Chưa có mã giảm giá nào</h3>
          <p className="text-gray-500 text-sm mt-2">Hãy quay lại sau để nhận các ưu đãi mới nhất nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vouchers.map((voucher) => (
            <div 
              key={voucher._id} 
              className="relative bg-white border border-gray-200 rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition group"
            >
              {/* Left Side - Visual */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-32 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 -right-2 w-4 bg-white rounded-l-full z-10"></div>
                <div className="absolute top-0 bottom-0 -left-2 w-4 bg-white rounded-r-full z-10 opacity-20"></div>
                
                <Ticket size={32} className="mb-2 opacity-80" />
                <span className="text-xl font-black tracking-tighter">
                  {voucher.discountType === 'percent' ? `${voucher.discountValue}%` : 'GIẢM'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">OFF</span>
              </div>

              {/* Right Side - Info */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                     <span className="inline-block px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded">
                        {voucher.code}
                     </span>
                     <span className="text-[10px] font-medium text-red-500 flex items-center gap-1">
                        <Clock size={12} /> {calculateTimeLeft(voucher.endDate)}
                     </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{voucher.description}</h3>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                     {voucher.discountType === 'fixed' && (
                        <p>Giảm trực tiếp: <span className="font-bold text-gray-700">{formatCurrency(voucher.discountValue)}</span></p>
                     )}
                     {voucher.maxDiscount > 0 && (
                        <p>Giảm tối đa: <span className="font-bold text-gray-700">{formatCurrency(voucher.maxDiscount)}</span></p>
                     )}
                     <p>Đơn tối thiểu: <span className="font-bold text-gray-700">{formatCurrency(voucher.minOrderValue)}</span></p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                   <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12}/> HSD: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                   </div>
                   
                   <button
                    onClick={() => handleCopy(voucher.code, voucher._id)}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                      copiedId === voucher._id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                   >
                      {copiedId === voucher._id ? (
                        <>Đã chép <CheckCircle size={14}/></>
                      ) : (
                        <>Sao chép <Copy size={14}/></>
                      )}
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded text-blue-800 text-xs flex items-start gap-3">
         <Info className="flex-shrink-0 mt-0.5" size={16}/>
         <div>
            <p className="font-bold uppercase tracking-wider mb-1">Hướng dẫn sử dụng:</p>
            <p className="leading-relaxed opacity-80">
               Sao chép mã voucher và nhập vào ô "Mã giảm giá" tại bước thanh toán. 
               Mỗi mã chỉ có hiệu lực trong thời gian quy định và số lượng có hạn.
            </p>
         </div>
      </div>
    </div>
  );
}
