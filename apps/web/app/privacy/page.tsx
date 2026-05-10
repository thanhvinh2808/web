"use client";
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl bg-white p-10 shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary uppercase tracking-widest mb-10 transition">
          <ArrowLeft size={16}/> Quay lại trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary">
            <ShieldCheck size={32}/>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Chính sách & Điều khoản</h1>
        </div>
        <div className="prose prose-stone max-w-none text-gray-600 font-medium">
          <p className="text-lg text-gray-800 font-bold mb-6">Chào mừng bạn đến với FootMark. Chúng tôi cam kết bảo vệ quyền lợi và thông tin của khách hàng.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">1. Cam kết chính hãng</h3>
          <p>Tất cả sản phẩm tại FootMark đều được kiểm định nghiêm ngặt qua quy trình Check Legit 3 bước trước khi lên kệ.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">2. Bảo mật thông tin</h3>
          <p>Chúng tôi sử dụng công nghệ mã hóa hiện đại để bảo vệ dữ liệu cá nhân và lịch sử giao dịch của bạn.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">3. Chính sách vận chuyển</h3>
          <p>Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ. Thời gian giao hàng dự kiến từ 2-4 ngày làm việc.</p>
        </div>
      </div>
    </div>
  );
}
