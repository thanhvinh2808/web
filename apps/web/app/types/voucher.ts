export interface Voucher {
  id: string;
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed'; // Giảm theo % hoặc số tiền cố định
  discountValue: number; // Giá trị giảm (% hoặc số tiền)
  minOrderValue: number; // Giá trị đơn hàng tối thiểu
  maxDiscount?: number; // Giảm tối đa (chỉ áp dụng cho % discount)
  expiryDate: string; // Ngày hết hạn
  usageLimit: number; // Số lần sử dụng tối đa
  usedCount: number; // Số lần đã sử dụng
  isActive: boolean;
}
