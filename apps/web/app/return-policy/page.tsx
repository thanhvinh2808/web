"use client";
import React from 'react';
import Link from 'next/link';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl bg-white p-10 shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary uppercase tracking-widest mb-10 transition">
          <ArrowLeft size={16}/> Quay lại trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary">
            <RefreshCcw size={32}/>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Chính sách bảo hành & Đổi trả</h1>
        </div>
        <div className="prose prose-stone max-w-none text-gray-600 font-medium">
          <h3 className="text-black font-black uppercase tracking-wide mt-8">1. Chính sách đổi trả</h3>
          <p>Hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên tem tag, chưa qua sử dụng và có lỗi từ nhà sản xuất.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">2. Chính sách bảo hành</h3>
          <p>Bảo hành keo chỉ trọn đời cho tất cả các dòng sản phẩm giày bán lẻ tại FootMark.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">3. Trường hợp không được bảo hành</h3>
          <p>Sản phẩm bị hư hỏng do tác động ngoại lực, sử dụng hóa chất tẩy rửa mạnh hoặc bảo quản sai cách.</p>
        </div>
      </div>
    </div>
  );
}
