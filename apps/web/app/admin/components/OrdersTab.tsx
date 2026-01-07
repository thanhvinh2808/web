// app/admin/components/OrdersTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface OrderItem {
  productId: string;
  productName: string;
  productBrand?: string;
  productImage?: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'paid' | 'unpaid';
  paymentMethod?: string;
  discountAmount?: number; // ✅ THÊM
  voucherCode?: string; // ✅ THÊM
  createdAt: string;
}

interface OrdersTabProps {
  orders: Order[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

const statusLabels: { [key: string]: string } = {
  pending: 'Chờ Duyệt',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao Hàng',
  delivered: 'Hoàn Thành',
  cancelled: 'Hủy'
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function OrdersTab({ orders, token, onRefresh, showMessage }: OrdersTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortPaystatus, setPaystatus] = useState<'paid' | 'unpaid' | ''>('');
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  // ✅ TÍNH TOÁN CHÍNH XÁC THEO LOGIC CHECKOUT
  const calculateOrderDetails = (order: Order) => {
    // Tạm tính
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // VAT 1%
    const vatAmount = Math.round(subtotal * 0.01);

    // Phí vận chuyển
    const calculateShippingFee = () => {
      if (subtotal >= 1000000) return 0;
      if (subtotal >= 500000) return 30000;
      return 50000;
    };
    const shippingFee = calculateShippingFee();

    // Giảm giá
    const discountAmount = order.discountAmount || 0;

    // Tổng cuối cùng
    const finalTotal = subtotal + shippingFee + vatAmount - discountAmount;

    return {
      subtotal,
      vatAmount,
      shippingFee,
      discountAmount,
      finalTotal
    };
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/api/admin/orders/${orderId}`);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('✅ Cập nhật trạng thái thành công!');
        onRefresh();
      } else {
        showMessage('❌ ' + (data.message || 'Cập nhật thất bại'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showMessage('❌ Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
      const matchesPaymentStatus = 
      sortPaystatus === '' || 
    (sortPaystatus === 'paid' && (order.paymentStatus === 'paid' || order.status === 'delivered')) ||
    (sortPaystatus === 'unpaid' && order.paymentStatus !== 'paid' && order.status !== 'delivered');
  
  return matchesSearch && matchesStatus && matchesPaymentStatus;
    
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      // ✅ SẮP XẾP THEO TỔNG TIỀN THỰC TẾ
      const totalA = calculateOrderDetails(a).finalTotal;
      const totalB = calculateOrderDetails(b).finalTotal;
      return sortOrder === 'asc' ? totalA - totalB : totalB - totalA;
    }
  });

  // ✅ STATISTICS TÍNH ĐÚNG
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + calculateOrderDetails(o).finalTotal, 0)
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-teal-500">
          <p className="text-gray-600 text-sm">Doanh thu</p>
          <p className="text-2xl font-bold text-teal-600">{formatPrice(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm đơn hàng (ID, tên khách hàng)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipped">Đang giao</option>
            <option value="delivered">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as 'date' | 'amount');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="date-desc">Mới nhất</option>
            <option value="date-asc">Cũ nhất</option>
            <option value="amount-desc">Giá cao nhất</option>
            <option value="amount-asc">Giá thấp nhất</option>
          </select>
         <select
              value={sortPaystatus}
              onChange={(e) => {
                const payStatus = e.target.value as 'paid' | 'unpaid';
                setPaystatus(payStatus);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Trạng thái thanh toán</option>
              <option value="paid">Đã Thanh Toán</option>
              <option value="unpaid">Chưa Thanh Toán</option>
            </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                  sortedOrders.map((order, OrderItem) => {
                   
                  const orderDetails = calculateOrderDetails(order);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
  <div className="space-y-2">
    {order.items.map((item, index) => (
      <div key={index} className="flex items-center gap-2">
        <img 
          src={item.productImage || '/placeholder.png'} 
          alt={item.productName}
          className="w-10 h-10 object-cover rounded flex-shrink-0"
        />
        <span className="text-sm truncate max-w-[120px]">{item.productName}</span>
      </div>
    ))}
  </div>
</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.userId?.name || order.customerInfo?.fullName || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {order.userId?.email || order.customerInfo?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          x {order.items.length}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatPrice(orderDetails.finalTotal)}
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                          <div>Tạm tính: {formatPrice(orderDetails.subtotal)}</div>
                          <div>VAT (1%): {formatPrice(orderDetails.vatAmount)}</div>
                          <div>
                            Ship: {orderDetails.shippingFee === 0 ? 'Miễn phí' : formatPrice(orderDetails.shippingFee)}
                          </div>
                          {orderDetails.discountAmount > 0 && (
                            <div className="text-green-600">
                              Giảm: -{formatPrice(orderDetails.discountAmount)}
                              {order.voucherCode && ` (${order.voucherCode})`}
                            </div>
                          )}
                          <div className="border-t pt-0.5 mt-0.5">
                            {order.paymentStatus === 'paid' || order.status === 'delivered' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]} ${
                              order.status === 'delivered' || order.status === 'cancelled'
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer hover:opacity-80'
                            }`}
                          >
                            <option value="pending" disabled={order.status !== 'pending'}>
                              Chờ Duyệt
                            </option>
                            <option value="processing" disabled={!['pending', 'processing'].includes(order.status)}>
                              Đang Xử Lý
                            </option>
                            <option value="shipped" disabled={!['processing', 'shipped'].includes(order.status)}>
                              Đang Giao
                            </option>
                            <option value="delivered" disabled={!['shipped', 'delivered'].includes(order.status)}>
                              Hoàn Thành
                            </option>
                            <option value="cancelled">
                              Hủy
                            </option>
                          </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="text-teal-600 hover:text-teal-900 font-medium"
                        >
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination info */}
      {sortedOrders.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Hiển thị {sortedOrders.length} / {orders.length} đơn hàng
        </div>
        
      )}
    </div>
    
  );
}