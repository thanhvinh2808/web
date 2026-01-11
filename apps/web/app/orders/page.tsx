// app/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Package, Filter, CheckCircle, XCircle, Clock, Truck, Eye, Loader2 } from "lucide-react";
import { useOrders } from "../../contexts/OrderContext";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FilterType = 'all' | 'paid' | 'unpaid' | 'pending' | 'shipping' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const { orders, isLoading, getPaidOrders, getUnpaidOrders } = useOrders();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const getFilteredOrders = () => {
    switch (filter) {
      case 'paid':
        return getPaidOrders();
      case 'unpaid':
        return getUnpaidOrders();
      case 'all':
        return orders;
      default:
        return orders.filter(order => order.status === filter);
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'processing':
        return { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'paid':
        return { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'shipped':
      case 'shipping':
        return { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: Truck };
      case 'delivered':
      case 'completed':
        return { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: Package };
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cod': return 'COD';
      case 'banking': return 'Chuyển khoản';
      case 'momo': return 'MoMo';
      case 'card': return 'Thẻ';
      default: return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Package className="text-blue-600" size={36} />
            Lịch sử đơn hàng
          </h1>
          <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h3 className="font-semibold">Lọc đơn hàng:</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã thanh toán ({getPaidOrders().length})
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'unpaid'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chưa thanh toán ({getUnpaidOrders().length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ xử lý
            </button>
            <button
              onClick={() => setFilter('shipping')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'shipping'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang giao
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-full font-medium transition ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {filter === 'all' ? 'Chưa có đơn hàng' : `Không có đơn hàng ${filter}`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Bạn chưa có đơn hàng nào' 
                : `Không tìm thấy đơn hàng với bộ lọc "${filter}"`}
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order._id || order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-semibold text-lg">#{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
                          <StatusIcon size={16} />
                          {statusConfig.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(order.isPaid || order.paymentStatus === 'paid') ? (
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle size={18} />
                            Đã thanh toán
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 font-medium">
                            <XCircle size={18} />
                            Chưa thanh toán
                          </div>
                        )}
                        <Link
                          href={`/orders/${order._id || order.id}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye size={18} />
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    {/* Products */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium line-clamp-1">{item.productName}</div>
                            <div className="text-sm text-gray-500">
                              {item.productBrand} • SL: {item.quantity}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Info */}
                    <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Người nhận:</div>
                        <div className="font-medium">{order.customerInfo.fullName}</div>
                        <div className="text-sm text-gray-600">{order.customerInfo.phone}</div>
                        <div className="text-sm text-gray-600 mt-1">{order.customerInfo.address}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Thanh toán:</div>
                        <div className="font-medium">{getPaymentMethodLabel(order.paymentMethod)}</div>
                        <div className="text-2xl font-bold text-blue-600 mt-2">
                          {order.totalAmount.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistics */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="text-blue-600 text-sm font-medium mb-1">Tổng đơn hàng</div>
              <div className="text-2xl font-bold text-blue-900">{orders.length}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-green-600 text-sm font-medium mb-1">Đã thanh toán</div>
              <div className="text-2xl font-bold text-green-900">{getPaidOrders().length}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="text-red-600 text-sm font-medium mb-1">Chưa thanh toán</div>
              <div className="text-2xl font-bold text-red-900">{getUnpaidOrders().length}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-purple-600 text-sm font-medium mb-1">Tổng giá trị</div>
              <div className="text-xl font-bold text-purple-900">
                {orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}