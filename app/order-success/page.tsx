// app/order-success/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useOrders } from '../contexts/OrderContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '../contexts/OrderContext';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const { getOrderById } = useOrders();

  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Thêm error state nếu cần

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        setIsLoading(true);
        try {
          const foundOrder = await getOrderById(orderId); // Giả sử async
          setOrder(foundOrder);
        } catch (err) {
          console.error('Error fetching order:', err);
          setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
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
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-2xl font-bold mt-4">Đang tải thông tin đơn hàng...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">{error || 'Không tìm thấy đơn hàng'}</h2>
        <p className="text-gray-600 mb-6">Mã đơn hàng không hợp lệ hoặc đã có lỗi xảy ra.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg text-center">
        <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-6">Cảm ơn bạn, {order.customerInfo.fullName}, đã mua hàng!</p>
        
        <div className="bg-gray-50 p-6 rounded-lg text-left space-y-3">
          <p className="flex justify-between">
            <span className="font-semibold">Mã đơn hàng:</span>
            <span className="font-mono">{order.orderNumber}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-semibold">Tổng thanh toán:</span>
            <span className="font-bold text-blue-600">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
          </p>
          <p className="flex justify-between">
            <span className="font-semibold">Phương thức:</span>
            <span>{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Đã thanh toán'}</span>
          </p>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Chúng tôi sẽ liên hệ với bạn qua SĐT: {order.customerInfo.phone} để xác nhận đơn.
        </p>

        <div className="mt-8 space-x-4">
          <Link href="/products" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">
            Tiếp tục mua sắm
          </Link>
          <Link href="/profile/orders" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Xem lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}