"use client";
import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl bg-white p-10 shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary uppercase tracking-widest mb-10 transition">
          <ArrowLeft size={16}/> Quay lại trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary">
            <FileText size={32}/>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Điều khoản dịch vụ</h1>
        </div>
        <div className="prose prose-stone max-w-none text-gray-600 font-medium">
          <h3 className="text-black font-black uppercase tracking-wide mt-8">1. Chấp thuận điều khoản</h3>
          <p>Bằng việc truy cập và sử dụng website FootMark, bạn đồng ý tuân thủ các điều khoản và điều kiện sử dụng của chúng tôi.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">2. Tài khoản người dùng</h3>
          <p>Người dùng chịu trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">3. Giao dịch và thanh toán</h3>
          <p>Chúng tôi hỗ trợ nhiều hình thức thanh toán an toàn và cam kết giao đúng sản phẩm khách hàng đã chọn.</p>
        </div>
      </div>
    </div>
  );
}
