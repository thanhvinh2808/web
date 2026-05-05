'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ShoppingBag, 
  ArrowRight, 
  Receipt, 
  CreditCard, 
  AlertCircle,
  Truck,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

interface VnpayReturnResult {
  success: boolean;
  isVerified: boolean;
  message: string;
  orderNumber: string | null;
  orderId: string | null;
  amount: number;
  transactionNo: string;
  bankCode: string;
  payDate: string;
}

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [loading, setLoading] = useState(true);

  // VNPay Response Codes Map
  const getVnPayMessage = (code: string | null) => {
    switch (code) {
      case '00': return 'Giao dịch thành công. Cảm ơn bạn đã tin dùng FootMark!';
      case '24': return 'Bạn đã hủy yêu cầu thanh toán. Đừng lo, đơn hàng vẫn được giữ lại để bạn thanh toán sau.';
      case '07': return 'Giao dịch bị nghi ngờ gian lận. Vui lòng liên hệ ngân hàng của bạn.';
      case '09': return 'Thẻ/Tài khoản của quý khách chưa đăng ký dịch vụ Internet Banking.';
      case '11': return 'Giao dịch không thành công do đã hết thời hạn thanh toán.';
      case '12': return 'Thẻ/Tài khoản của quý khách đang bị khóa.';
      case '51': return 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.';
      default: return 'Giao dịch không thành công hoặc có lỗi xảy ra trong quá trình xử lý.';
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryString = searchParams.toString();
        const res = await fetch(`${CLEAN_API_URL}/api/vnpay/return?${queryString}`);
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({
          success: false,
          isVerified: false,
          message: 'Không thể kết nối đến server xác thực',
          orderNumber: null,
          orderId: null,
          amount: 0,
          transactionNo: '',
          bankCode: '',
          payDate: '',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
           <CreditCard className="absolute inset-0 m-auto text-primary w-8 h-8 animate-pulse" />
        </div>
        <p className="font-black text-xl italic uppercase tracking-[0.2em] text-gray-900 mb-2">Đang xác thực</p>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Vui lòng không đóng trình duyệt...</p>
      </div>
    );
  }

  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const isSuccess = result?.success && result?.isVerified && vnpResponseCode === '00';
  const customMessage = getVnPayMessage(vnpResponseCode);

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Status Card */}
        <div className="bg-white shadow-2xl shadow-black/5 overflow-hidden border border-gray-100 relative">
          {/* Status Ribbon */}
          <div className={`h-2 w-full ${isSuccess ? 'bg-green-500' : vnpResponseCode === '24' ? 'bg-orange-400' : 'bg-red-500'}`} />
          
          <div className="p-10 text-center">
            <div className={`w-24 h-24 flex items-center justify-center mx-auto mb-8 rounded-full border-4 ${
              isSuccess 
                ? 'bg-green-50 border-green-100 text-green-600' 
                : vnpResponseCode === '24' 
                  ? 'bg-orange-50 border-orange-100 text-orange-500'
                  : 'bg-red-50 border-red-100 text-red-500'
            }`}>
              {isSuccess ? (
                <CheckCircle className="w-12 h-12" />
              ) : vnpResponseCode === '24' ? (
                <Info className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>

            <h1 className="text-4xl font-black italic tracking-tighter mb-4 uppercase leading-none">
              {isSuccess ? 'Thanh toán thành công' : vnpResponseCode === '24' ? 'Đã hủy thanh toán' : 'Thanh toán thất bại'}
            </h1>

            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-md mx-auto mb-10">
              {customMessage}
            </p>

            {/* Receipt Details */}
            {(isSuccess || result?.transactionNo) && (
              <div className="bg-gray-50 border-y border-dashed border-gray-200 -mx-10 px-10 py-8 text-left space-y-4 mb-10">
                <div className="flex items-center gap-2 mb-2">
                   <Receipt size={16} className="text-gray-400" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Chi tiết giao dịch</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mã đơn hàng</p>
                    <p className="font-bold text-sm text-gray-900 italic uppercase tracking-tight">#{result?.orderNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số tiền thanh toán</p>
                    <p className="font-black text-lg text-primary italic leading-none">
                      {result?.amount ? (result.amount / 100).toLocaleString('vi-VN') : 0}₫
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ngân hàng / Cổng</p>
                    <p className="font-bold text-sm text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                       <Smartphone size={14} className="text-blue-500" /> {result?.bankCode || 'VNPAY'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mã giao dịch VNPay</p>
                    <p className="font-mono text-xs font-bold text-gray-500">{result?.transactionNo || '---'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isSuccess && result?.orderId ? (
                <>
                  <Link
                    href={`/profile/orders/${result.orderId}`}
                    className="px-10 py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary transition-all duration-300 shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                  >
                    <ShoppingBag size={16} className="group-hover:-translate-y-0.5 transition-transform" /> Xem đơn hàng
                  </Link>
                  <Link
                    href="/products"
                    className="px-10 py-5 border-2 border-gray-100 bg-white text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] hover:border-black hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Tiếp tục mua sắm <ChevronRight size={16} />
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => result?.orderId ? router.push(`/profile/orders/${result.orderId}`) : router.push('/checkout')}
                    className="px-10 py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all duration-300 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
                  >
                    <AlertCircle size={16} className="group-hover:rotate-12 transition-transform" /> 
                    {vnpResponseCode === '24' ? 'Thanh toán lại sau' : 'Thanh toán lại'}
                  </button>
                  <Link
                    href="/"
                    className="px-10 py-5 border-2 border-gray-100 bg-white text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] hover:border-black hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Quay về trang chủ
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-3">
             <ShieldCheck size={16} className="text-green-500" />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giao dịch được bảo mật bởi VNPay & FootMark System</span>
          </div>
        </div>

        {/* Footer Support Prompt */}
        {!isSuccess && (
          <div className="bg-blue-50 border border-blue-100 p-6 flex items-start gap-4">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Smartphone className="text-blue-500" size={20} />
             </div>
             <div>
                <p className="font-black text-[10px] uppercase tracking-widest text-blue-600 mb-1 italic">Bạn cần hỗ trợ?</p>
                <p className="text-xs text-blue-500 font-medium leading-relaxed uppercase tracking-tight">
                   Nếu gặp vấn đề về trừ tiền nhưng đơn hàng chưa cập nhật, vui lòng liên hệ Hotline: <span className="font-black">1900 xxxx</span> để được xử lý ngay lập tức.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">Đang khởi tạo...</p>
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  );
}
