"use client";
import React from 'react';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';

export default function CheckLegitPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl bg-white p-10 shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary uppercase tracking-widest mb-10 transition">
          <ArrowLeft size={16}/> Quay lại trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary">
            <Search size={32}/>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Quy trình Check Legit</h1>
        </div>
        <div className="prose prose-stone max-w-none text-gray-600 font-medium">
          <p className="text-lg text-gray-800 font-bold mb-6">Tại FootMark, chúng tôi cam kết 100% sản phẩm là hàng chính hãng (Authentic).</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">Bước 1: Kiểm tra ngoại quan</h3>
          <p>Kiểm tra hộp, tem tag, đường chỉ và form dáng tổng thể của đôi giày.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">Bước 2: Kiểm tra chi tiết</h3>
          <p>Sử dụng đèn UV kiểm tra các dấu hiệu bảo mật ngầm, chất liệu da và đế giày.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">Bước 3: Đối chiếu cơ sở dữ liệu</h3>
          <p>Sử dụng các ứng dụng Check Legit uy tín và đối chiếu với mẫu chuẩn (Retail) có sẵn tại kho.</p>
        </div>
      </div>
    </div>
  );
}
