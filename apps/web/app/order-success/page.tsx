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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-bold mb-4 text-red-600">{error || 'Không tìm thấy đơn hàng'}</h2>
        <Link href="/" className="text-blue-600 hover:underline">Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-center p-10 mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter mb-2">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="text-gray-500 mb-8">Cảm ơn {order.customerInfo.fullName}, đơn hàng của bạn đang được xử lý.</p>
          
          <div className="inline-flex gap-4">
            <Link href="/products" className="px-6 py-3 bg-gray-100 rounded-lg font-bold text-sm uppercase hover:bg-gray-200 transition">
              Tiếp tục mua sắm
            </Link>
            <Link href="/profile/orders" className="px-6 py-3 bg-black text-white rounded-lg font-bold text-sm uppercase hover:bg-stone-800 transition">
              Xem đơn hàng
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-bold text-lg flex items-center gap-2">
                <ShoppingBag size={20}/> Chi tiết đơn hàng
             </h3>
             <span className="font-mono text-sm text-gray-500">#{order.orderNumber}</span>
          </div>
          
          <div className="p-6 space-y-6">
             {/* List Items */}
             <div className="space-y-4">
                {order.items.map((item: any, idx: number) => (
                   <div key={idx} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                         <img src={item.productImage} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-sm line-clamp-1">{item.productName}</h4>
                         {item.variant && (
                            <p className="text-xs text-blue-600 font-bold mt-1">Size: {item.variant.name}</p>
                         )}
                         <div className="flex justify-between items-end mt-1">
                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                            <span className="text-sm font-bold">{item.price.toLocaleString('vi-VN')}₫</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             {/* Total Summary */}
             <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                   <span className="text-gray-500">Tạm tính</span>
                   <span className="font-medium">{(order.totalAmount - (order.shippingFee || 0) + (order.discountAmount || 0)).toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-gray-500">Phí vận chuyển</span>
                   <span className="font-medium">{(order.shippingFee || 0).toLocaleString('vi-VN')}₫</span>
                </div>
                {(order.discountAmount || 0) > 0 && (
                   <div className="flex justify-between text-blue-600">
                      <span>Giảm giá</span>
                      <span className="font-bold">-{ (order.discountAmount || 0).toLocaleString('vi-VN')}₫</span>
                   </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-dashed border-gray-200">
                   <span className="font-black">Tổng thanh toán</span>
                   <span className="font-black text-blue-600">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
                </div>
             </div>

             {/* Shipping Info */}
             <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                <p className="font-bold mb-1">Địa chỉ nhận hàng:</p>
                <p>{order.customerInfo.address}</p>
                <p className="mt-1">SĐT: {order.customerInfo.phone}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
