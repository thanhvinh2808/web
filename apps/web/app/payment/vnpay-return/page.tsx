'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
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
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [loading, setLoading] = useState(true);

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
          message: 'Không thể xác thực kết quả thanh toán',
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="font-bold text-sm uppercase tracking-widest text-gray-500">
            Đang xác thực thanh toán...
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success && result?.isVerified;

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="container mx-auto px-4 max-w-lg">

        <div className="bg-white shadow-lg overflow-hidden text-center p-10 border border-gray-100">

          <div className={`w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 ${
            isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
          }`}>
            {isSuccess ? (
              <CheckCircle className="text-green-600 w-12 h-12" />
            ) : (
              <XCircle className="text-red-500 w-12 h-12" />
            )}
          </div>

          <h1 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">
            {isSuccess ? 'THANH TOÁN THÀNH CÔNG!' : 'THANH TOÁN THẤT BẠI'}
          </h1>

          <p className="text-gray-500 mb-8 font-medium italic">
            {result?.message || 'Có lỗi xảy ra'}
          </p>

          {isSuccess && result && (
            <div className="bg-gray-50 border border-gray-100 p-6 text-left space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  Mã đơn hàng
                </span>
                <span className="font-black italic">
                  {result.orderNumber || '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  Số tiền
                </span>
                <span className="font-black italic text-primary">
                  {result.amount?.toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  Ngân hàng
                </span>
                <span className="font-bold">{result.bankCode || '---'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  Mã giao dịch
                </span>
                <span className="font-mono text-xs font-bold">{result.transactionNo || '---'}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isSuccess && result?.orderId ? (
              <>
                <Link
                  href={`/order-success?orderId=${result.orderId}`}
                  className="px-8 py-4 bg-primary text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> Xem đơn hàng
                </Link>
                <Link
                  href="/products"
                  className="px-8 py-4 bg-gray-100 font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                >
                  Tiếp tục mua sắm <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/checkout"
                  className="px-8 py-4 bg-primary text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/20"
                >
                  Thử lại
                </Link>
                <Link
                  href="/"
                  className="px-8 py-4 bg-gray-100 font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all duration-150"
                >
                  Quay về trang chủ
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  );
}
