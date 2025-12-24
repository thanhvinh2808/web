// components/VoucherSelector.tsx
"use client";
import { useState, useEffect } from 'react';
import { Tag, X, Check, AlertCircle } from 'lucide-react';
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

  // Fetch vouchers từ API hoặc dữ liệu mẫu
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (API_URL) {
          const response = await fetch(`${API_URL}/vouchers`);
          if (response.ok) {
            const data = await response.json();
            setVouchers(data);
            return;
          }
        }
        
        // Dữ liệu mẫu nếu không có API
        setVouchers([
          {
            id: '1',
            code: 'WELCOME10',
            description: 'Giảm 10% cho đơn hàng đầu tiên',
            discountType: 'percentage',
            discountValue: 10,
            minOrderValue: 500000,
            maxDiscount: 100000,
            expiryDate: '2025-12-31',
            usageLimit: 100,
            usedCount: 0,
            isActive: true
          },
          {
            id: '2',
            code: 'SAVE50K',
            description: 'Giảm 50.000đ cho đơn từ 1 triệu',
            discountType: 'fixed',
            discountValue: 50000,
            minOrderValue: 1000000,
            expiryDate: '2025-12-31',
            usageLimit: 50,
            usedCount: 0,
            isActive: true
          },
          {
            id: '3',
            code: 'MEGA20',
            description: 'Giảm 20% tối đa 200k cho đơn từ 2 triệu',
            discountType: 'percentage',
            discountValue: 20,
            minOrderValue: 2000000,
            maxDiscount: 200000,
            expiryDate: '2025-12-31',
            usageLimit: 30,
            usedCount: 0,
            isActive: true
          },
          {
            id: '4',
            code: 'FREESHIP',
            description: 'Miễn phí vận chuyển',
            discountType: 'fixed',
            discountValue: 30000,
            minOrderValue: 0,
            expiryDate: '2025-12-31',
            usageLimit: 200,
            usedCount: 0,
            isActive: true
          }
        ]);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    fetchVouchers();
  }, []);

  // Tính số tiền giảm
  const calculateDiscount = (voucher: Voucher): number => {
    if (voucher.discountType === 'percentage') {
      const discount = (totalAmount * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    return voucher.discountValue;
  };

  // Kiểm tra voucher có hợp lệ không
  const isVoucherValid = (voucher: Voucher): { valid: boolean; reason?: string } => {
    if (!voucher.isActive) {
      return { valid: false, reason: 'Voucher không khả dụng' };
    }
    if (voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, reason: 'Voucher đã hết lượt sử dụng' };
    }
    if (new Date(voucher.expiryDate) < new Date()) {
      return { valid: false, reason: 'Voucher đã hết hạn' };
    }
    if (totalAmount < voucher.minOrderValue) {
      return { 
        valid: false, 
        reason: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}₫` 
      };
    }
    return { valid: true };
  };

  // Áp dụng voucher
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

  // Áp dụng voucher bằng code
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

  // Xóa voucher
  const handleRemoveVoucher = () => {
    onVoucherApply(null);
    setError('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Tag size={20} className="text-orange-500" />
        Mã giảm giá
      </h3>

      {/* Voucher đã chọn */}
      {selectedVoucher ? (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <span className="font-bold text-orange-600">{selectedVoucher.code}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveVoucher}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-2">{selectedVoucher.description}</p>
          <div className="text-green-600 font-bold">
            Tiết kiệm: {formatCurrency(calculateDiscount(selectedVoucher))}
          </div>
        </div>
      ) : (
        <>
          {/* Input nhập code */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã giảm giá"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
            />
            <button
              type="button"
              onClick={handleApplyCode}
              disabled={isLoading || !voucherCode.trim()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Đang xử lý...' : 'Áp dụng'}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Nút mở danh sách voucher - THÊM type="button" */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
          >
            {isOpen ? 'Ẩn' : 'Xem'} danh sách voucher khả dụng
          </button>

          {/* Danh sách voucher */}
          {isOpen && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {vouchers
                .filter(v => v.isActive && new Date(v.expiryDate) >= new Date())
                .map((voucher) => {
                  const validation = isVoucherValid(voucher);
                  const discount = calculateDiscount(voucher);

                  return (
                    <div
                      key={voucher.id}
                      className={`border-2 rounded-lg p-4 transition ${
                        validation.valid
                          ? 'border-orange-200 hover:border-orange-400 cursor-pointer hover:shadow-md'
                          : 'border-gray-200 opacity-60 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (validation.valid) {
                          handleApplyVoucher(voucher);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="text-orange-500" size={18} />
                          <span className="font-bold text-orange-600">{voucher.code}</span>
                        </div>
                        {validation.valid && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Khả dụng
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{voucher.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-500">
                          Đơn tối thiểu: {formatCurrency(voucher.minOrderValue)}
                        </div>
                        {validation.valid && (
                          <div className="text-green-600 font-semibold">
                            Giảm: {formatCurrency(discount)}
                          </div>
                        )}
                      </div>

                      {!validation.valid && (
                        <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {validation.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};