// app/admin/components/OrdersTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User, Mail, Phone, Package, CreditCard, Clock, Search, CheckCircle, DollarSign } from 'lucide-react';

import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

interface OrderItem {
  productId: string,
  productName: string,
  productBrand?: string,
  productImage?: string,
  price: number,
  quantity: number,
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
  discountAmount?: number; 
  voucherCode?: string; 
  createdAt: string;
}

interface OrdersTabProps {
  orders: Order[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

const statusLabels: { [key: string]: string } = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
  cancellation_requested: 'Chờ duyệt hủy',
  refunded: 'Đã hoàn tiền'
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  cancellation_requested: 'bg-orange-100 text-orange-800',
  refunded: 'bg-teal-100 text-teal-800'
};

export default function OrdersTab({ orders, token, onRefresh, showMessage }: OrdersTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortPaystatus, setPaystatus] = useState<'paid' | 'unpaid' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const getImageUrl = (url: any): string => {
    if (!url) return '/placeholder.png';
    const cleanUrl = typeof url === 'string' ? url : (url.url || '');
    if (!cleanUrl || cleanUrl.includes('[object')) return '/placeholder.png';
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const baseUrl = API_URL;
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  // ✅ Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortPaystatus]);

  // ✅ TÍNH TOÁN
  const calculateOrderDetails = (order: Order) => {
    // Tạm tính
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // VAT 10%
    const vatAmount = Math.round(subtotal * 0.1);

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
    router.push(`/admin/orders/${orderId}`);
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

  const handleApproveCancel = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu hủy đơn hàng này? Hệ thống sẽ tự động hoàn kho.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/approve-cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        showMessage('✅ Đã duyệt hủy và hoàn kho đơn hàng!');
        onRefresh();
      } else {
        showMessage('❌ ' + (data.message || 'Thao tác thất bại'));
      }
    } catch (error) {
      showMessage('❌ Có lỗi xảy ra');
    }
  };

  const handleRejectCancel = async (orderId: string) => {
    if (!window.confirm('Từ chối yêu cầu hủy và tiếp tục xử lý đơn hàng này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/reject-cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        showMessage('✅ Đã từ chối yêu cầu hủy!');
        onRefresh();
      } else {
        showMessage('❌ ' + (data.message || 'Thao tác thất bại'));
      }
    } catch (error) {
      showMessage('❌ Có lỗi xảy ra');
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

  // ✅ Phân trang
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = sortedOrders.slice(startIndex, endIndex);

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
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-black uppercase mb-2"> Quản Lý Đơn Hàng</h2>
          <p className="text-gray-500 font-medium text-sm">Theo dõi và xử lý đơn hàng của FootMark</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package size={24} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Total</span>
          </div>
          <p className="text-4xl font-black text-black tracking-tight mb-1">{stats.total}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tổng đơn hàng</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">
              <Clock size={24} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">Pending</span>
          </div>
          <p className="text-4xl font-black text-black tracking-tight mb-1">{stats.pending}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Đang chờ xử lý</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <CheckCircle size={24} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-lg">Done</span>
          </div>
          <p className="text-4xl font-black text-black tracking-tight mb-1">{stats.delivered}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Đã hoàn thành</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Revenue</span>
          </div>
          <p className="text-3xl font-black text-black tracking-tight mb-1">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Doanh thu thực tế</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-bold text-sm transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-black outline-none cursor-pointer hover:bg-gray-100 transition"
          >
            <option value="all"> Tất cả trạng thái</option>
            <option value="pending"> Chờ xác nhận</option>
            <option value="processing"> Đang xử lý</option>
            <option value="shipped"> Đang giao hàng</option>
            <option value="delivered"> Hoàn thành</option>
            <option value="cancelled"> Đã hủy</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as 'date' | 'amount');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-black outline-none cursor-pointer hover:bg-gray-100 transition"
          >
            <option value="date-desc"> Mới nhất</option>
            <option value="date-asc"> Cũ nhất</option>
            <option value="amount-desc"> Giá cao nhất</option>
            <option value="amount-asc"> Giá thấp nhất</option>
          </select>
          
          <select
              value={sortPaystatus}
              onChange={(e) => {
                const payStatus = e.target.value as 'paid' | 'unpaid';
                setPaystatus(payStatus);
              }}
              className="px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-black outline-none cursor-pointer hover:bg-gray-100 transition"
            >
              <option value=""> Thanh toán</option>
              <option value="paid">Đã Thanh Toán</option>
              <option value="unpaid">Chưa Thanh Toán</option>
            </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn hàng</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá trị</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái xử lý</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={40} className="text-gray-200" />
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Không tìm thấy đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                  currentOrders.map((order) => {
                  const orderDetails = calculateOrderDetails(order);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-all group">
                      {/* Cột 1: Đơn hàng & Thời gian */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black font-mono text-black leading-none">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <Clock size={10} />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Khách hàng */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1 max-w-[180px]">
                          <span className="text-sm font-bold text-gray-900 line-clamp-1 italic uppercase tracking-tight">
                            {order.userId?.name || order.customerInfo?.fullName || 'Khách vãng lai'}
                          </span>
                          <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                            <span className="truncate">{order.userId?.email || order.customerInfo?.email || 'N/A'}</span>
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {order.customerInfo?.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Cột 3: Sản phẩm */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3 overflow-hidden">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="relative inline-block w-9 h-9 rounded-lg border-2 border-white bg-gray-50 overflow-hidden shadow-sm">
                                <img 
                                  src={getImageUrl(item.productImage)} 
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-white bg-black text-white text-[9px] font-black shadow-sm">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{order.items.length} món</span>
                        </div>
                      </td>

                      {/* Cột 4: Giá trị & TT Thanh toán */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-black text-black leading-none italic tracking-tight">
                            {formatPrice(orderDetails.finalTotal)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {order.paymentStatus === 'paid' || order.status === 'delivered' ? (
                              <span className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Đã TT</span>
                            ) : (
                              <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 tracking-tighter">Chờ TT</span>
                            )}
                            <span className="text-[9px] font-bold text-gray-400 uppercase">{order.paymentMethod === 'cod' ? 'COD' : 'Online'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái xử lý (TRỌNG TÂM) */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {order.status === 'cancellation_requested' ? (
                            <div className="flex items-center gap-1 bg-orange-50 p-1 rounded-xl border border-orange-100 shadow-sm">
                              <button
                                onClick={() => handleApproveCancel(order._id)}
                                title="Duyệt Hủy"
                                className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-green-700 hover:scale-105 active:scale-95 transition shadow-sm"
                              >
                                Duyệt Hủy
                              </button>
                              <button
                                onClick={() => handleRejectCancel(order._id)}
                                title="Từ Chối"
                                className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-700 hover:scale-105 active:scale-95 transition shadow-sm"
                              >
                                Từ Chối
                              </button>
                            </div>
                          ) : (
                            <div className="relative inline-block w-full max-w-[140px]">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                disabled={['delivered', 'cancelled', 'refunded'].includes(order.status)}
                                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-none outline-none ring-1 ring-inset ${
                                  statusColors[order.status]
                                } ${
                                  ['delivered', 'cancelled', 'refunded'].includes(order.status)
                                    ? 'opacity-60 cursor-not-allowed shadow-none'
                                    : 'cursor-pointer hover:brightness-95 ring-black/5 shadow-sm active:scale-95'
                                }`}
                              >
                                <option value={order.status} disabled>{statusLabels[order.status]}</option>
                                {order.status === 'pending' && <option value="processing">Đang xử lý</option>}
                                {order.status === 'processing' && <option value="shipped">Đang giao hàng</option>}
                                {order.status === 'shipped' && <option value="delivered">Hoàn thành</option>}
                              </select>
                              {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 6: Hành động */}
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all hover:shadow-lg active:scale-95 group-hover:bg-primary group-hover:shadow-primary/20"
                        >
                          Chi tiết
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-bold text-xs transition ${
                      currentPage === pageNum
                        ? 'bg-black text-white shadow-lg scale-110'
                        : 'bg-white border border-gray-200 text-black hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === currentPage - 2 || 
                pageNum === currentPage + 2
              ) {
                return <span key={pageNum} className="flex items-end pb-2">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      
      {/* Pagination info */}
      {sortedOrders.length > 0 && (
        <div className="text-sm text-gray-600 text-center mt-2">
          Hiển thị {currentOrders.length} / {sortedOrders.length} đơn hàng
        </div>
      )}
    </div>
  );
}
