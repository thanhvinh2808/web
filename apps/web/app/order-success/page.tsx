// app/order-success/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useOrders } from '../contexts/OrderContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '../contexts/OrderContext';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { getOrderById } = useOrders();

  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        setIsLoading(true);
        try {
          const foundOrder = await getOrderById(orderId);
          setOrder(foundOrder);
        } catch (err) {
          console.error('Error fetching order:', err);
          setError('Không thể tải thông tin đơn hàng.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, getOrderById]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-black mb-4 text-red-600 italic uppercase tracking-tighter italic uppercase">{error || 'Không tìm thấy đơn hàng'}</h2>
        <Link href="/" className="text-primary font-bold hover:underline uppercase tracking-widest text-sm">Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <div className="bg-white rounded-none shadow-lg overflow-hidden text-center p-10 mb-6 border border-gray-100">
          <div className="w-24 h-24 bg-green-50 rounded-none flex items-center justify-center mx-auto mb-6 border-2 border-green-100">
            <CheckCircle className="text-green-600 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter mb-2 uppercase italic uppercase">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="text-gray-500 mb-10 font-medium italic italic uppercase">Cảm ơn {order.customerInfo.fullName}, đơn hàng của bạn đang được xử lý.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products" className="px-8 py-4 bg-gray-100 rounded-none font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition">
              Tiếp tục mua sắm
            </Link>
            <Link href="/profile/orders" className="px-8 py-4 bg-primary text-white rounded-none font-bold text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition shadow-lg shadow-primary/20">
              Xem đơn hàng
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-black italic text-lg flex items-center gap-2 uppercase tracking-tighter italic uppercase">
                <ShoppingBag size={20} className="text-primary"/> Chi tiết đơn hàng
             </h3>
             <span className="font-mono text-xs font-bold text-gray-400">#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
          </div>
          
          <div className="p-6 space-y-6">
             <div className="space-y-4">
                {order.items.map((item: any, idx: number) => (
                   <div key={idx} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-none overflow-hidden border border-gray-200 flex-shrink-0 relative">
                         <img src={item.productImage} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-sm line-clamp-1 uppercase italic tracking-tighter italic uppercase">{item.productName}</h4>
                         {item.variant && (
                            <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest italic uppercase">Size: {item.variant.name}</p>
                         )}
                         <div className="flex justify-between items-end mt-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">x{item.quantity}</span>
                            <span className="text-sm font-black italic">{item.price.toLocaleString('vi-VN')}₫</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="border-t border-gray-100 pt-6 space-y-3 text-sm">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                   <span>Tạm tính</span>
                   <span className="text-black italic text-sm">{(order.totalAmount - (order.shippingFee || 0) + (order.discountAmount || 0)).toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                   <span>Phí vận chuyển</span>
                   <span className="text-green-600 italic text-sm">{(order.shippingFee || 0).toLocaleString('vi-VN')}₫</span>
                </div>
                {(order.discountAmount || 0) > 0 && (
                   <div className="flex justify-between text-xs font-bold text-primary uppercase tracking-widest">
                      <span>Giảm giá</span>
                      <span className="font-black italic text-sm">-{ (order.discountAmount || 0).toLocaleString('vi-VN')}₫</span>
                   </div>
                )}
                <div className="flex justify-between text-lg pt-4 border-t border-dashed border-gray-200 items-end">
                   <span className="font-black uppercase italic tracking-tighter italic uppercase">Tổng thanh toán</span>
                   <span className="font-black text-2xl text-primary italic tracking-tighter leading-none">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
                </div>
             </div>

             <div className="bg-primary/5 p-5 rounded-none text-sm text-primary border border-primary/10">
                <p className="font-black uppercase tracking-widest text-[10px] mb-2 italic uppercase">Địa chỉ nhận hàng:</p>
                <p className="font-bold italic italic uppercase text-gray-700">{order.customerInfo.fullName} - {order.customerInfo.phone}</p>
                <p className="mt-1 text-xs font-medium text-gray-500 italic uppercase leading-relaxed">{order.customerInfo.address}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}