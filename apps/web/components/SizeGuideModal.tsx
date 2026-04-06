'use client';

import { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  brandId: string;
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ brandId, brandName, isOpen, onClose }: SizeGuideModalProps) {
  const [sizeGuide, setSizeGuide] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeGender, setActiveGender] = useState('Men'); // Mặc định Men
  
  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen && brandId) {
      fetchSizeGuide(activeGender);
    }
  }, [isOpen, brandId, activeGender]);

  const fetchSizeGuide = async (gender: string) => {
    setLoading(true);
    try {
      // Gọi API lấy SizeGuide của Brand theo Gender
      const res = await fetch(`${API_URL}/size-guides/${brandId}?gender=${gender}`);
      const data = await res.json();
      
      if (data.success && data.sizeGuide) {
        setSizeGuide(data.sizeGuide);
      } else {
        setSizeGuide(null);
      }
    } catch (error) {
      console.error("Failed to fetch size guide", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden animate-scale-in relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Ruler className="text-primary"/> Bảng quy đổi Size - {brandName}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition rounded-full">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Gender Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {['Men', 'Women', 'Kids'].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGender(g)}
                className={`pb-2 text-sm font-bold uppercase tracking-widest transition border-b-2 ${
                  activeGender === g 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Đang tải dữ liệu...</div>
          ) : sizeGuide ? (
            <div className="overflow-x-auto">
              {sizeGuide.imageUrl ? (
                 <img src={sizeGuide.imageUrl} alt="Size Chart" className="w-full h-auto"/>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase font-black text-gray-500">
                    <tr>
                      <th className="px-4 py-3">US</th>
                      <th className="px-4 py-3">UK</th>
                      <th className="px-4 py-3">EU</th>
                      <th className="px-4 py-3">CM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sizeGuide.sizes.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-bold">{row.us}</td>
                        <td className="px-4 py-3">{row.uk}</td>
                        <td className="px-4 py-3">{row.eu}</td>
                        <td className="px-4 py-3">{row.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Chưa có dữ liệu size cho {brandName} ({activeGender})
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            Mẹo: Đo chiều dài chân vào buổi chiều để có kết quả chính xác nhất
          </p>
        </div>

      </div>
    </div>
  );
}
