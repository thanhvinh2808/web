// app/profile/orders/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOrders } from '@/app/contexts/OrderContext';
import { useCart } from '@/app/contexts/CartContext';
import Link from 'next/link';
import { Package, Receipt, XCircle, CheckCircle, Truck, ArrowLeft, Filter, Clock, ShoppingCart, Loader2, CreditCard, DollarSign } from 'lucide-react';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { orders } = useOrders();
  const { addToCart } = useCart();
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all'); // ✅ THÊM STATE
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      const filtered = orders.filter(order => 
        order.userId === user.id || order.userId === user._id
      );
      setUserOrders(filtered);
      setFilteredOrders(filtered);
    } else {
      setUserOrders([]);
      setFilteredOrders([]);
    }
  }, [user, orders]);

  // ✅ CẬP NHẬT LOGIC FILTER
  useEffect(() => {
    let filtered = userOrders;

    // Filter theo trạng thái đơn hàng
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter theo trạng thái thanh toán
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(order => {
        if (selectedPaymentStatus === 'paid') {
          return order.paymentStatus === 'paid' || order.status === 'delivered';
        } else if (selectedPaymentStatus === 'unpaid') {
          return order.paymentStatus !== 'paid' && order.status !== 'delivered';
        }
        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [selectedStatus, selectedPaymentStatus, userOrders]);

  // ✅ HÀM MUA LẠI ĐƠN HÀNG
  const handleReorder = async (order: any) => {
    try {
      setReorderingId(order.id || order._id);

      let totalProductsAdded = 0;

      for (const item of order.items) {
        const product = {
          _id: parseInt(item.productId) || Date.now() + Math.random(),
          name: item.productName,
          brand: item.productBrand,
          price: item.price,
          originalPrice: item.price,
          rating: 0,
          image: item.productImage,
          description: '',
          stock: 999
        };

        addToCart(product, item.quantity);
        totalProductsAdded += item.quantity;
      }

      alert(`✅ Đã thêm ${totalProductsAdded} sản phẩm (${order.items.length} loại) vào giỏ hàng!`);
      router.push('/cart');

    } catch (error) {
      console.error('❌ Lỗi khi mua lại đơn hàng:', error);
      alert('❌ Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setReorderingId(null);
    }
  };

  const getOrderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-semibold">
            <Receipt size={16} /> Chờ xử lý
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-semibold">
            <Clock size={16} /> Đang xử lý
          </span>
        );
      case 'shipped':
        return (
          <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-sm font-semibold">
            <Truck size={16} /> Đang giao
          </span>
        );
      case 'delivered':
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-semibold">
            <Package size={16} /> Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-semibold">
            <XCircle size={16} /> Đã huỷ
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // ✅ HÀM HIỂN THỊ TRẠNG THÁI THANH TOÁN
  const getPaymentStatus = (order: any) => {
    const isPaid = order.paymentStatus === 'paid' || order.status === 'delivered';
    
    if (isPaid) {
      return (
        <span className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-semibold">
          <CreditCard size={16} /> Đã thanh toán
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm font-semibold">
          <DollarSign size={16} /> Chưa thanh toán
        </span>
      );
    }
  };

  const statusFilters = [
    { value: 'all', label: 'Tất cả', count: userOrders.length },
    { value: 'pending', label: 'Chờ xử lý', count: userOrders.filter(o => o.status === 'pending').length },
    { value: 'processing', label: 'Đang xử lý', count: userOrders.filter(o => o.status === 'processing').length },
    { value: 'shipped', label: 'Đang giao', count: userOrders.filter(o => o.status === 'shipped').length },
    { value: 'delivered', label: 'Hoàn thành', count: userOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length },
    { value: 'cancelled', label: 'Đã huỷ', count: userOrders.filter(o => o.status === 'cancelled').length },
  ];

  // ✅ THÊM FILTER THANH TOÁN
  const paymentFilters = [
    { value: 'all', label: 'Tất cả', count: userOrders.length },
    { 
      value: 'paid', 
      label: 'Đã thanh toán', 
      count: userOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered').length 
    },
    { 
      value: 'unpaid', 
      label: 'Chưa thanh toán', 
      count: userOrders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'delivered').length 
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <Link 
              href="/profile"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Quay lại trang cá nhân
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Lịch sử đơn hàng</h1>
            <p className="text-gray-600 mt-2">
              Quản lý và theo dõi tất cả đơn hàng của bạn
            </p>
          </div>

          {/* ✅ FILTER TRẠNG THÁI ĐƠN HÀNG */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={20} className="text-gray-600" />
              <h3 className="font-semibold text-gray-700">Lọc theo trạng thái đơn hàng</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    selectedStatus === filter.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedStatus === filter.value
                        ? 'bg-white/20'
                        : 'bg-gray-300'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        {/* ✅ FILTER TRẠNG THÁI THANH TOÁN - BÊN TRÁI */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
  <div className="flex items-center gap-2 mb-3">
    <CreditCard size={20} className="text-gray-600" />
    <h3 className="font-semibold text-gray-700">Lọc theo trạng thái thanh toán</h3>
  </div>
  <div className="flex flex-wrap gap-2">
    {paymentFilters.map(filter => (
      <button
        key={filter.value}
        onClick={() => setSelectedPaymentStatus(filter.value)}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
          selectedPaymentStatus === filter.value
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {filter.label}
        {filter.count > 0 && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            selectedPaymentStatus === filter.value
              ? 'bg-white/20'
              : 'bg-gray-300'
          }`}>
            {filter.count}
          </span>
        )}
      </button>
    ))}
  </div>
</div>

          {filteredOrders.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-gray-100">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Không tìm thấy đơn hàng nào
              </h2>
              <p className="text-gray-600 mb-6">
                Thử chọn bộ lọc khác hoặc xem tất cả đơn hàng.
              </p>
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedPaymentStatus('all');
                }}
                className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Xem tất cả đơn hàng
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const isCompleted = order.status === 'delivered' || order.status === 'completed';
                const isReordering = reorderingId === (order.id || order._id);

                return (
                  <div 
                    key={order.id || order._id} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <h2 className="text-xl font-bold text-blue-700">
                          Đơn hàng #{order.orderNumber || order._id?.slice(-8)}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {/* ✅ HIỂN THỊ CẢ HAI TRẠNG THÁI */}
                      <div className="mt-3 md:mt-0 flex flex-col md:flex-row gap-2">
                        {getOrderStatus(order.status)}
                        {getPaymentStatus(order)}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <img 
                            src={item.productImage} 
                            alt={item.productName} 
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.productName}</p>
                            <p className="text-sm text-gray-600">
                              Số lượng: {item.quantity} x {item.price.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {(item.quantity * item.price).toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          + Và {order.items.length - 3} sản phẩm khác
                        </p>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-left md:text-left w-full md:w-auto">
                        <p className="text-gray-600 text-sm mb-1">Tổng thanh toán</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {order.totalAmount.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <Link 
                          href={`/profile/orders/${order.id || order._id}`} 
                          className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center transition"
                        >
                          Xem chi tiết
                        </Link>
                        
                        {isCompleted && (
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={isReordering}
                            className="flex-1 md:flex-none px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-800 text-center transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isReordering ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={18} />
                                Mua lại
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}