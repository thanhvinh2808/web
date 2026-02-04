import React, { useEffect, useState } from 'react';
import { Copy, Check, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface QRCodePaymentProps {
  amount: number;
  orderInfo: string;
  orderId?: string;
  accountName?: string;
  accountNumber?: string;
  bankId?: string; 
}

export default function QRCodePayment({
  amount,
  orderInfo,
  orderId,
  accountName = "VO THANH VINH",
  accountNumber = "0378538884",
  bankId = "970422" 
}: QRCodePaymentProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isPaid, setIsPaid] = useState(false);
  const intAmount = Math.ceil(amount);
  
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-print.png?amount=${intAmount}&addInfo=${encodeURIComponent(orderInfo)}&accountName=${encodeURIComponent(accountName)}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // ✅ GIẢ LẬP LẮNG NGHE THANH TOÁN (SOCKET HOẶC POLLING)
    // Trong thực tế, anh sẽ dùng socket.on('paymentSuccess', ...)
    const checkPayment = setInterval(() => {
       // Ở đây em làm logic giả lập: Nếu nhấn nút "Tôi đã chuyển tiền" 
       // hoặc sau một thời gian nhất định (nếu anh muốn test tự động)
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(checkPayment);
    };
  }, []);

  const handleTransferred = async () => {
    toast.success('Hệ thống đang kiểm tra giao dịch...');
    
    try {
      if (orderId) {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '$ {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}';
        await fetch(`${API_URL}/api/orders/${orderId}/pay`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }

    // Giả lập sau 2 giây hệ thống xác nhận thành công
    setTimeout(() => {
      setIsPaid(true);
      toast.success('Thanh toán thành công!');
      // Tự động chuyển trang sau 3 giây
      setTimeout(() => {
        router.push('/profile/orders');
      }, 3000);
    }, 2000);
  };

  if (isPaid) {
    return (
      <div className="bg-white border-2 border-green-500 rounded-none p-10 text-center animate-bounce-in max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-600 w-12 h-12" />
        </div>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Thanh toán thành công!</h3>
        <p className="text-gray-500 text-sm font-medium mb-6">Hệ thống đã nhận được tiền. Đơn hàng của bạn đang được xử lý.</p>
        <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Loader2 className="animate-spin" size={16}/> Đang chuyển trang...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-blue-100 rounded-none overflow-hidden shadow-lg animate-fade-in-up max-w-md mx-auto">
      <div className="bg-primary/10 p-4 border-b border-blue-100 text-center relative overflow-hidden">
         {/* Hiệu ứng sóng quét cho thấy đang chờ */}
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
         
         <h3 className="font-black text-primary uppercase tracking-widest text-sm flex items-center justify-center gap-2 relative z-10">
            <Clock size={16}/> Chờ thanh toán: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
         </h3>
         <div className="flex items-center justify-center gap-2 mt-1 relative z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Hệ thống đang chờ bạn quét mã...</p>
         </div>
      </div>
      
      <div className="p-6">
         {/* QR Code với overlay "Đang chờ" mờ nhẹ */}
         <div className="bg-white p-2 border border-gray-200 rounded-none shadow-inner mb-6 mx-auto w-fit relative group">
            <img src={qrUrl} alt="VietQR Payment" className="w-full max-w-[250px] object-contain block" />
         </div>
         
         {/* Các trường thông tin copy giữ nguyên như cũ */}
         <div className="space-y-4 text-sm mb-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
               <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Số tiền</span>
               <span className="font-black text-primary text-lg">{amount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-center bg-yellow-50 p-2 border border-yellow-100">
               <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Nội dung CK</span>
               <span className="font-black text-red-500">{orderInfo}</span>
            </div>
         </div>

         <button 
            onClick={handleTransferred}
            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-primary transition-all text-xs flex items-center justify-center gap-2"
         >
            Tôi đã chuyển tiền <Check size={16}/>
         </button>
      </div>
    </div>
  );
}
