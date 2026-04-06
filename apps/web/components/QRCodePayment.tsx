"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, Copy, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../app/contexts/SocketContext'; // Đảm bảo bạn đã có SocketContext
import { useRouter } from 'next/navigation';

// ✅ CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN (THAY CỦA BẠN VÀO ĐÂY)
const BANK_INFO = {
  BANK_ID: 'MB', // Mã ngân hàng (MB, VCB, TPB...)
  ACCOUNT_NO: '0336066224', // Số tài khoản của bạn
  TEMPLATE: 'compact', // compact, qr_only, print
  ACCOUNT_NAME: 'VO THANH VINH' // Tên chủ tài khoản
};

interface QRCodePaymentProps {
  orderId: string;
  orderCode: string; // Mã đơn hàng (VD: ORD-1234)
  amount: number;
  onSuccess?: () => void;
}

export default function QRCodePayment({ orderId, orderCode, amount, onSuccess }: QRCodePaymentProps) {
  const router = useRouter();
  const { socket } = useSocket(); // Dùng socket để lắng nghe sự kiện
  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 phút đếm ngược

  // Tạo nội dung chuyển khoản: "TT [Mã Đơn Hàng]"
  const description = `TT ${orderCode}`.replace(/[^a-zA-Z0-9]/g, ''); 
  
  // Link tạo QR động từ VietQR
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-${BANK_INFO.TEMPLATE}.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;

  // Format tiền tệ
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Format thời gian đếm ngược
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ LẮNG NGHE SOCKET: Khi Server báo "Paid" -> Tự động chuyển trạng thái
  useEffect(() => {
    if (!socket) return;

    const handleOrderStatus = (data: any) => {
      // Check đúng đơn hàng và trạng thái đã thanh toán
      if (data.orderId === orderId && (data.paymentStatus === 'paid' || data.isPaid)) {
        setIsPaid(true);
        toast.success('Thanh toán thành công! Cảm ơn bạn.');
        if (onSuccess) onSuccess();
      }
    };

    socket.on('orderStatusUpdated', handleOrderStatus);

    return () => {
      socket.off('orderStatusUpdated', handleOrderStatus);
    };
  }, [socket, orderId, onSuccess]);

  // ✅ HÀM GIẢ LẬP THANH TOÁN (DÀNH CHO DEMO)
  const simulatePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Socket sẽ tự trigger việc update UI, nhưng ta set luôn cho nhanh
        setIsPaid(true); 
      }
    } catch (error) {
      console.error('Demo payment error', error);
    }
  };

  if (isPaid) {
    return (
      <div className="bg-green-50 border border-green-200 p-8 text-center animate-fade-in rounded-none">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-green-700 uppercase tracking-tighter mb-2">Thanh toán thành công</h3>
        <p className="text-green-600 font-medium mb-4">Đơn hàng của bạn đang được xử lý.</p>
        <button 
          onClick={() => router.push('/profile/orders')}
          className="bg-green-600 text-white px-6 py-2 font-bold uppercase tracking-widest hover:bg-green-700 transition"
        >
          Xem đơn hàng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-xl p-6 max-w-sm mx-auto animate-fade-in-up rounded-none">
      <div className="text-center mb-6">
        <h3 className="text-lg font-black uppercase tracking-tighter text-primary flex items-center justify-center gap-2">
           <Smartphone size={20}/> Quét mã thanh toán
        </h3>
        <p className="text-xs text-gray-500 font-bold uppercase mt-1">
          Hỗ trợ MoMo / VNPay / App Ngân hàng
        </p>
      </div>

      {/* QR Image */}
      <div className="relative group mx-auto w-fit mb-6">
         <div className="border-2 border-primary p-2 bg-white rounded-none">
            <img 
               src={qrUrl} 
               alt="VietQR Payment" 
               className="w-48 h-48 object-contain"
            />
         </div>
         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 border border-gray-200 shadow text-[10px] font-bold text-gray-500 whitespace-nowrap rounded-none">
            Hết hạn sau: <span className="text-red-500">{formatTime(countdown)}</span>
         </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-none border border-gray-100 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Ngân hàng:</span>
          <span className="font-bold">{BANK_INFO.BANK_ID}</span>
        </div>
        <div className="flex justify-between">
           <span className="text-gray-500 font-medium">Chủ TK:</span>
           <span className="font-bold uppercase text-xs">{BANK_INFO.ACCOUNT_NAME}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Số TK:</span>
          <div className="flex items-center gap-2">
             <span className="font-bold tracking-wider">{BANK_INFO.ACCOUNT_NO}</span>
             <button 
               onClick={() => { navigator.clipboard.writeText(BANK_INFO.ACCOUNT_NO); toast.success('Đã sao chép'); }}
               className="text-primary hover:text-black"
             >
               <Copy size={12}/>
             </button>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
          <span className="text-gray-500 font-medium">Số tiền:</span>
          <span className="font-black text-lg text-primary">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Nội dung:</span>
          <div className="flex items-center gap-2">
             <span className="font-bold text-black bg-yellow-100 px-2 py-0.5">{description}</span>
             <button 
               onClick={() => { navigator.clipboard.writeText(description); toast.success('Đã sao chép nội dung'); }}
               className="text-primary hover:text-black"
             >
               <Copy size={12}/>
             </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
           Hệ thống tự động xác nhận sau 1-3 phút
        </p>

        {/* DEMO BUTTON - CHỈ HIỆN KHI DEV HOẶC DEMO */}
        <button 
           onClick={simulatePayment}
           className="w-full border border-dashed border-gray-300 text-gray-400 py-2 text-xs font-bold hover:bg-gray-50 hover:text-black transition uppercase tracking-widest"
           title="Click để giả lập thanh toán thành công (Demo Only)"
        >
           [Demo] Xác nhận đã thanh toán
        </button>
      </div>
    </div>
  );
}