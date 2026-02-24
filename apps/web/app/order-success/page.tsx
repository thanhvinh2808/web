"use client";
import { useSearchParams } from 'next/navigation';
import { useOrders } from '../contexts/OrderContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '../contexts/OrderContext';
import { CheckCircle, ShoppingBag, Truck, Receipt } from 'lucide-react';
import QRCodePayment from '../../components/QRCodePayment';

// ─── Đồng bộ với OrderDetailPage & OrdersPage ─────────────────────────────────
function calcSummary(order: any) {
  const items = order?.items || [];

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity, 0
  );

  const vatAmount = Math.round(subtotal * 0.1);

  const shippingFee: number = (() => {
    if (typeof order?.shippingFee === 'number') return order.shippingFee;
    if (subtotal >= 1_000_000) return 0;
    if (subtotal >= 500_000)   return 30_000;
    return 50_000;
  })();

  const discountAmount = Number(order?.discountAmount) || 0;

  const finalTotal = subtotal + vatAmount + shippingFee - discountAmount;

  return { subtotal, vatAmount, shippingFee, discountAmount, finalTotal };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { getOrderById } = useOrders();

  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: URL ảnh
  const getImageUrl = (url: any): string => {
    if (!url) return '/placeholder.png';
    const cleanUrl = typeof url === 'string' ? url : (url.url || '');
    if (!cleanUrl || cleanUrl.includes('[object')) return '/placeholder.png';
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
    return `${base}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        let foundOrder = getOrderById(orderId);
        if (!foundOrder) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            foundOrder = data.order || data;
          }
        }
        setOrder(foundOrder);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Không thể tải thông tin đơn hàng.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, getOrderById]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-black mb-4 text-red-600 italic uppercase tracking-tighter">
          {error || 'Không tìm thấy đơn hàng'}
        </h2>
        <Link href="/" className="text-primary font-bold hover:underline uppercase tracking-widest text-sm">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  const { subtotal, vatAmount, shippingFee, discountAmount, finalTotal } = calcSummary(order);

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="container mx-auto px-4 max-w-3xl">

        {/* ── Success card ──────────────────────────────── */}
        <div className="bg-white shadow-lg overflow-hidden text-center p-10 mb-6 border border-gray-100">
          <div className="w-24 h-24 bg-green-50 flex items-center justify-center mx-auto mb-6 border-2 border-green-100">
            <CheckCircle className="text-green-600 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="text-gray-500 mb-10 font-medium italic uppercase">
            Cảm ơn {order.customerInfo.fullName}, đơn hàng của bạn đang được xử lý.
          </p>

          {/* QR banking */}
          {order.paymentMethod === 'banking' && order.paymentStatus === 'unpaid' && (
            <div className="mb-10">
              <QRCodePayment
                amount={finalTotal}
                orderCode={order.orderNumber || (typeof orderId === 'string' ? orderId.slice(-6).toUpperCase() : 'ORDER')}
                orderId={(order as any)._id || (order as any).id || ''}
                onSuccess={() => window.location.reload()}
              />
            </div>
          )}

          {/* Đã thanh toán */}
          {(order.paymentStatus === 'paid' || (order as any).isPaid) && (
            <div className="mb-10 bg-green-50 p-4 border border-green-200 text-green-700 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Đơn hàng đã được thanh toán
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products" className="px-8 py-4 bg-gray-100 font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all duration-150">
              Tiếp tục mua sắm
            </Link>
            <Link href="/profile/orders" className="px-8 py-4 bg-primary text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary/90 active:scale-95 active:brightness-90 transition-all duration-150 shadow-lg shadow-primary/20">
              Xem đơn hàng
            </Link>
          </div>
        </div>

        {/* ── Order detail card ─────────────────────────── */}
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-black italic text-lg flex items-center gap-2 uppercase tracking-tighter">
              <ShoppingBag size={20} className="text-primary" /> Chi tiết đơn hàng
            </h3>
            <span className="font-mono text-xs font-bold text-gray-400">
              #{order.orderNumber || (order as any)._id?.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="p-6 space-y-6">

            {/* Items */}
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                    <img src={getImageUrl(item.productImage)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm line-clamp-1 uppercase italic tracking-tighter">{item.productName}</h4>
                    {item.variant && (
                      <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest italic">
                        Size: {item.variant.name}
                      </p>
                    )}
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">x{item.quantity}</span>
                      <span className="text-sm font-black italic">{item.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Cost breakdown ───────────────────────────── */}
            <div className="border border-gray-100 overflow-hidden">

              {/* Title */}
              <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 border-b border-gray-100">
                <Receipt size={14} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chi tiết thanh toán</span>
              </div>

              <div className="px-5 py-4 space-y-3">

                {/* Tạm tính */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500 uppercase tracking-widest">Tạm tính</span>
                  <span className="font-bold text-gray-800">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>

                {/* VAT */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500 uppercase tracking-widest">Thuế VAT</span>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5">10%</span>
                  </div>
                  <span className="font-bold text-blue-600">+{vatAmount.toLocaleString('vi-VN')}₫</span>
                </div>

                {/* Ship */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Truck size={12} className={shippingFee === 0 ? 'text-green-500' : 'text-gray-400'} />
                    <span className="font-bold text-gray-500 uppercase tracking-widest">Phí vận chuyển</span>
                    {shippingFee === 0 && (
                      <span className="text-[9px] font-black bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5">Free</span>
                    )}
                    {subtotal < 500_000 && shippingFee > 0 && (
                      <span className="text-[9px] text-gray-400 font-medium italic hidden sm:inline">
                        (thêm {(500_000 - subtotal).toLocaleString('vi-VN')}₫ để giảm phí)
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${shippingFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {shippingFee === 0 ? 'Miễn phí' : `+${shippingFee.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>

                {/* Giảm giá */}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary uppercase tracking-widest">Mã giảm giá</span>
                      {(order as any).voucherCode && (
                        <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5">
                          {(order as any).voucherCode}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-primary">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}

                {/* Tổng */}
                <div className="flex justify-between items-end pt-4 border-t-2 border-dashed border-gray-100">
                  <div>
                    <p className="font-black uppercase italic tracking-tighter text-base">Tổng thanh toán</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Đã bao gồm VAT 10%
                    </p>
                  </div>
                  <span className="font-black text-2xl text-primary italic tracking-tighter leading-none">
                    {finalTotal.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Quick 3-col summary */}
              <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/60">
                {[
                  { label: 'Hàng hóa', value: subtotal,    color: 'text-gray-700'  },
                  { label: 'VAT 10%',  value: vatAmount,   color: 'text-blue-600'  },
                  { label: 'Vận chuyển', value: shippingFee, color: shippingFee === 0 ? 'text-green-600' : 'text-gray-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                    <p className={`text-xs font-black italic ${color}`}>
                      {value === 0 && label === 'Vận chuyển' ? 'Miễn phí' : `${value.toLocaleString('vi-VN')}₫`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="bg-primary/5 p-5 text-sm border border-primary/10">
              <p className="font-black uppercase tracking-widest text-[10px] mb-2 italic text-primary">Địa chỉ nhận hàng:</p>
              <p className="font-bold italic uppercase text-gray-700">
                {order.customerInfo.fullName} — {order.customerInfo.phone}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 italic uppercase leading-relaxed">
                {order.customerInfo.address}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}