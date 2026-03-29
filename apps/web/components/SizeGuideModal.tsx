'use client';

import { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ brandName, isOpen, onClose }: SizeGuideModalProps) {
  const [activeGender, setActiveGender] = useState('Men');

  const standardSizes: Record<string, any[]> = {
    'Men': [
      { us: '7', uk: '6', eu: '40', cm: '25' },
      { us: '8', uk: '7', eu: '41', cm: '26' },
      { us: '9', uk: '8', eu: '42.5', cm: '27' },
      { us: '10', uk: '9', eu: '44', cm: '28' },
      { us: '11', uk: '10', eu: '45', cm: '29' },
    ],
    'Women': [
      { us: '5', uk: '2.5', eu: '35.5', cm: '22' },
      { us: '6', uk: '3.5', eu: '36.5', cm: '23' },
      { us: '7', uk: '4.5', eu: '38', cm: '24' },
      { us: '8', uk: '5.5', eu: '39', cm: '25' },
    ],
    'Kids': [
      { us: '10C', uk: '9.5', eu: '27', cm: '16' },
      { us: '12C', uk: '11.5', eu: '29.5', cm: '18' },
      { us: '1Y', uk: '13.5', eu: '32', cm: '20' },
      { us: '3Y', uk: '2.5', eu: '35', cm: '22' },
    ]
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose} // ✅ Click ra ngoài để đóng
    >
      <div 
        className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden animate-scale-in relative border border-gray-100"
        onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click vào trong bảng
      >
        
        {/* Header - Thu gọn padding */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-black">
            <Ruler className="text-blue-600" size={18}/> Bảng Size chuẩn
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 transition text-gray-400 hover:text-black">
            <X size={20}/>
          </button>
        </div>

        {/* Content - Tối ưu diện tích */}
        <div className="p-4">
          <div className="flex gap-6 mb-4 border-b border-gray-100">
            {['Men', 'Women', 'Kids'].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGender(g)}
                className={`pb-2 text-[10px] font-black uppercase tracking-widest transition border-b-2 ${
                  activeGender === g 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase text-center">US</th>
                  <th className="px-3 py-2 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase text-center">UK</th>
                  <th className="px-3 py-2 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase text-center">EU</th>
                  <th className="px-3 py-2 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase text-center">CM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {standardSizes[activeGender].map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition">
                    <td className="px-3 py-2 font-black italic text-center text-black">{row.us}</td>
                    <td className="px-3 py-2 font-bold text-center text-gray-500">{row.uk}</td>
                    <td className="px-3 py-2 font-bold text-center text-gray-500">{row.eu}</td>
                    <td className="px-3 py-2 font-black text-center text-blue-600">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer - Nhỏ gọn */}
        <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            * Áp dụng chuẩn quốc tế tại FootMark
          </p>
        </div>

      </div>
    </div>
  );
}
