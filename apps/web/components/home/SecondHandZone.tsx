'use client';
import React from 'react';
import { SECONDHAND_DEALS } from './data';
import { Clock, CheckCircle, ShoppingCart } from 'lucide-react';

export default function SecondHandZone() {
  return (
    <section className="py-20 bg-stone-100 relative overflow-hidden">
      {/* Decorative BG Text */}
      <div className="absolute top-0 right-0 text-[200px] font-black text-stone-200 leading-none select-none -z-0 opacity-50 pointer-events-none">
        2HAND
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-600 text-white px-3 py-1 font-bold text-xs uppercase rounded">Hot Deal</span>
              <span className="text-red-600 font-bold flex items-center gap-1 animate-pulse"><Clock size={16}/> Sắp hết hàng</span>
            </div>
            <h3 className="text-4xl font-black text-gray-900 italic uppercase">Góc 2Hand Tuyển Chọn</h3>
            <p className="text-stone-600 mt-2 max-w-xl">
              Giày đã qua sử dụng, được spa sạch sẽ, check legit kỹ càng. Mô tả đúng tình trạng (98%, 95%...). Giá chỉ bằng 1/2 - 1/3 giá mới.
            </p>
          </div>
          <button className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-stone-800 transition">
            Xem Kho 2Hand
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECONDHAND_DEALS.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 hover:shadow-xl hover:border-stone-400 transition-all group">
              {/* Header Card */}
              <div className="flex justify-between items-start mb-3">
                <div className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-1 rounded">
                  Size {item.size}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-green-600 font-bold text-sm">Cond {item.condition}</span>
                  <span className="text-[10px] text-gray-400">{item.accessories}</span>
                </div>
              </div>

              {/* Image */}
              <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <h4 className="font-bold text-gray-900 mb-1 line-clamp-1" title={item.name}>{item.name}</h4>
              <p className="text-xs text-stone-500 mb-3 flex items-center gap-1">
                <CheckCircle size={12} className="text-blue-500"/> {item.note}
              </p>

              <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-400 line-through">Thị trường: {item.originalPrice.toLocaleString()}đ</span>
                  <span className="text-lg font-black text-red-600">{item.price.toLocaleString()}đ</span>
                </div>
                <button className="bg-stone-900 text-white p-2 rounded-lg hover:bg-blue-600 transition">
                  <ShoppingCart size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
