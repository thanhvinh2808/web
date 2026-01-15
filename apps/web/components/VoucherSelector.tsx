// components/VoucherSelector.tsx
"use client";
import { useState, useEffect } from 'react';
import { Tag, X, Check, AlertCircle, Award, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { Voucher } from '../app/types/voucher';

interface VoucherSelectorProps {
  totalAmount: number;
  onVoucherApply: (voucher: Voucher | null) => void;
  selectedVoucher: Voucher | null;
}

export const VoucherSelector = ({ totalAmount, onVoucherApply, selectedVoucher }: VoucherSelectorProps) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (API_URL) {
          const response = await fetch(`${API_URL}/api/vouchers`);
          if (response.ok) {
            const data = await response.json();
            setVouchers(data);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    fetchVouchers();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateDiscount = (voucher: Voucher): number => {
    if (voucher.discountType === 'percentage') {
      const discount = (totalAmount * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    return voucher.discountValue;
  };

  const isVoucherValid = (voucher: Voucher): { valid: boolean; reason?: string } => {
    if (!voucher.isActive) return { valid: false, reason: 'Voucher tạm khóa' };
    if (voucher.usedCount >= voucher.usageLimit) return { valid: false, reason: 'Đã hết lượt sử dụng' };
    if (new Date(voucher.expiryDate) < new Date()) return { valid: false, reason: 'Voucher đã hết hạn' };
    if (totalAmount < voucher.minOrderValue) {
      return { 
        valid: false, 
        reason: `Mua thêm ${formatCurrency(voucher.minOrderValue - totalAmount)}` 
      };
    }
    return { valid: true };
  };

  const sortedVouchers = [...vouchers].sort((a, b) => {
    const validA = isVoucherValid(a).valid;
    const validB = isVoucherValid(b).valid;
    const discountA = calculateDiscount(a);
    const discountB = calculateDiscount(b);
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    if (validA && validB) return discountB - discountA; 
    return (a.minOrderValue || 0) - (b.minOrderValue || 0);
  });

  const bestVoucher = sortedVouchers.find(v => isVoucherValid(v).valid);

  const handleApplyVoucher = (voucher: Voucher) => {
    const validation = isVoucherValid(voucher);
    if (!validation.valid) {
      setError(validation.reason || 'Voucher không hợp lệ');
      return;
    }
    setError('');
    onVoucherApply(voucher);
    setIsOpen(false);
  };

  const handleApplyCode = () => {
    setIsLoading(true);
    setError('');
    const voucher = vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    if (!voucher) {
      setError('Mã voucher không tồn tại');
      setIsLoading(false);
      return;
    }
    const validation = isVoucherValid(voucher);
    if (!validation.valid) {
      setError(validation.reason || 'Voucher không hợp lệ');
      setIsLoading(false);
      return;
    }
    onVoucherApply(voucher);
    setVoucherCode('');
    setIsOpen(false);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden">
      {/* Header - Xanh dương */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 flex items-center gap-3">
        <Ticket className="text-white animate-pulse" size={22} />
        <h3 className="text-white font-bold text-lg tracking-tight">Mã Giảm Giá</h3>
      </div>

      <div className="p-5">
        {/* Selected Voucher Display - Xanh nhạt */}
        {selectedVoucher ? (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5 relative group overflow-hidden transition-all hover:border-blue-300">
            <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-400 opacity-20"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">ĐÃ CHỌN</div>
                  <span className="font-black text-blue-700 text-xl tracking-wider">{selectedVoucher.code}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">{selectedVoucher.description}</p>
                <div className="mt-2 text-green-600 font-extrabold text-lg flex items-center gap-1">
                  <Check size={18} />
                  Tiết kiệm: {formatCurrency(calculateDiscount(selectedVoucher))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onVoucherApply(null)}
                className="bg-white text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-sm border border-blue-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Input & Apply Button - Xanh dương */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="Nhập mã ưu đãi..."
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold tracking-wide uppercase text-blue-900"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCode}
                disabled={isLoading || !voucherCode.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold"
              >
                {isLoading ? '...' : 'ÁP DỤNG'}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs mb-4 bg-red-50 px-4 py-2.5 rounded-lg border border-red-100 animate-bounce">
                <AlertCircle size={14} />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Voucher List */}
            <div className="space-y-3">
               {sortedVouchers
                  .slice(0, isOpen ? undefined : 2)
                  .map((voucher) => {
                    const validation = isVoucherValid(voucher);
                    const discount = calculateDiscount(voucher);
                    const isBest = bestVoucher?._id === voucher._id && validation.valid;

                    return (
                      <div
                        key={voucher._id || voucher.id}
                        onClick={() => validation.valid && handleApplyVoucher(voucher)}
                        className={`relative flex items-stretch min-h-[90px] border rounded-xl overflow-hidden transition-all ${
                          validation.valid
                            ? 'border-blue-200 bg-white hover:shadow-md cursor-pointer hover:border-blue-400'
                            : 'border-gray-100 bg-gray-50/50 cursor-not-allowed'
                        }`}
                      >
                        {/* Left part (Type/Icon) - Xanh dương */}
                        <div className={`w-24 flex flex-col items-center justify-center border-r-2 border-dashed relative px-2 ${
                          validation.valid ? 'bg-blue-600 text-white border-blue-200' : 'bg-gray-200 text-gray-400 border-gray-100'
                        }`}>
                          {/* Cut-out circles */}
                          <div className="absolute -top-2 -right-[9px] w-4 h-4 bg-white border border-gray-100 rounded-full z-10"></div>
                          <div className="absolute -bottom-2 -right-[9px] w-4 h-4 bg-white border border-gray-100 rounded-full z-10"></div>
                          
                          <Tag size={24} className="mb-1" />
                          <span className="text-[10px] font-black uppercase text-center leading-tight">
                            {(voucher.discountType as string) === 'percent' || (voucher.discountType as string) === 'percentage' ? `GIẢM ${voucher.discountValue}%` : 'GIẢM TIỀN'}
                          </span>
                        </div>

                        {/* Right part (Details) */}
                        <div className="flex-1 p-3 flex flex-col justify-center">
                          {isBest && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 mb-1">
                              <Award size={10} className="fill-blue-600" />
                              ƯU ĐÃI TỐT NHẤT
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-base tracking-tight ${validation.valid ? 'text-gray-800' : 'text-gray-400'}`}>
                              {voucher.code}
                            </span>
                            {validation.valid && (
                              <span className="text-blue-700 font-black text-sm">
                                -{formatCurrency(discount)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{voucher.description}</p>
                          
                          {!validation.valid ? (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                              <AlertCircle size={10} />
                              {validation.reason}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-gray-400 font-medium">
                              HSD: {new Date((voucher as any).endDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* See more button - Xanh dương */}
            {vouchers.length > 2 && (
               <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded-xl border border-dashed border-gray-200 hover:border-blue-200"
                >
                  {isOpen ? (
                    <><ChevronUp size={14} /> THU GỌN</>
                  ) : (
                    <><ChevronDown size={14} /> XEM THÊM {vouchers.length - 2} VOUCHER KHÁC</>
                  )}
                </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
