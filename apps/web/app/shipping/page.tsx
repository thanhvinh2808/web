"use client";
import React from 'react';
import Link from 'next/link';
import { Truck, ArrowLeft } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl bg-white p-10 shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary uppercase tracking-widest mb-10 transition">
          <ArrowLeft size={16}/> Quay lại trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary">
            <Truck size={32}/>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Chính sách vận chuyển</h1>
        </div>
        <div className="prose prose-stone max-w-none text-gray-600 font-medium">
          <h3 className="text-black font-black uppercase tracking-wide mt-8">1. Phí vận chuyển</h3>
          <p>- Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ.</p>
          <p>- Đồng giá 30.000đ cho đơn hàng từ 500.000đ đến dưới 1.000.000đ.</p>
          <p>- Phí ship 50.000đ cho các đơn hàng dưới 500.000đ.</p>
          <h3 className="text-black font-black uppercase tracking-wide mt-8">2. Thời gian giao hàng</h3>
          <p>- Khu vực TP.HCM: 1-2 ngày làm việc.</p>
          <p>- Khu vực khác: 2-4 ngày làm việc.</p>
        </div>
      </div>
    </div>
  );
}
