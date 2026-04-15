// app/admin/orders/[id]/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Package, User, MapPin, CreditCard, Clock, CheckCircle, Info } from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

interface OrderItem {
  productId: string;
  productName: string;
  productBrand?: string;
  productImage?: string;
  price: number;
  quantity: number;
  _id?: string;
}

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  notes?: string;
}

interface Order {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
    phone?: number;
  };
  customerInfo?: CustomerInfo;
  email?: string;
  phone?: string;
  address?: string;
  totalAmount: number;
  status: string;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded';
  paymentMethod: 'cod' | 'banking' | 'momo' | 'card';
  items?: OrderItem[];
  createdAt?: string;
  notes?: string;
  discountAmount?: number;
  voucherCode?: string;
  cancelledBy?: 'user' | 'admin' | 'system' | null;
  cancelReason?: string | null;
  updatedAt: string;
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  
  const API_URL = CLEAN_API_URL;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateOrderDetails = (order: Order | null) => {
    if (!order || !order.items || !Array.isArray(order.items)) {
      return {
        subtotal: 0,
        vatAmount: 0,
        shippingFee: 0,
        discountAmount: 0,
        finalTotal: order?.totalAmount || 0
      };
    }
    
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const vatAmount = Math.round(subtotal * 0.1);

    const calculateShippingFee = () => {
      if (subtotal >= 1000000) return 0;
      if (subtotal >= 500000) return 30000;
      return 50000;
    };
    const shippingFee = calculateShippingFee();

    const discountAmount = order.discountAmount || 0;
    const finalTotal = order.totalAmount;

    return {
      subtotal,
      vatAmount,
      shippingFee,
      discountAmount,
      finalTotal
    };
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId || typeof window === 'undefined') return;

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!token) {
        setError('Vui lòng đăng nhập để xem chi tiết.');
        router.push('/login');
        return;
      }

      const fetchUrl = `${API_URL}/api/admin/orders/${orderId}`;
      
      const res = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          router.push('/admin');
          return;
        }
        if (res.status === 404) {
          setError('Không tìm thấy đơn hàng');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Không thể tải đơn hàng');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Lỗi khi tải đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId) return;

    try {
      setUpdating(true);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Vui lòng đăng nhập lại!');
        router.push('/admin');
        return;
      }

      const updateUrl = `${API_URL}/api/admin/orders/${orderId}/status`;

      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(`❌ ${data.message || 'Cập nhật thất bại'}`);
        return;
      }

      const updatedOrder = data.data || data.order;
      
      if (updatedOrder) {
        setOrder(updatedOrder);
        alert('✅ Cập nhật trạng thái thành công!');
      } else {
        await fetchOrder();
      }
      
    } catch (error) {
      console.error('❌ Network Error:', error);
      alert('❌ Lỗi kết nối! Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
    return `${API_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const orderDetails = calculateOrderDetails(order);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-800 mb-4">❌ {error}</p>
          <button 
            onClick={() => router.back()} 
            className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2 mx-auto"
          >
            <ChevronLeft size={20} /> Quay lại trang trước
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-800 mb-4">❌ Không tìm thấy đơn hàng</p>
          <button 
            onClick={() => router.back()} 
            className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2 mx-auto"
          >
            <ChevronLeft size={20} /> Quay lại trang trước
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-black mb-3 flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ChevronLeft size={16} /> Quay lại danh sách
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Đơn hàng <span className="text-gray-400">#{order._id.slice(-8).toUpperCase()}</span>
              </h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-1">Đặt lúc: {formatDate(order.createdAt)}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4 border-r border-gray-200 pr-4 hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng thanh toán</p>
              <p className="text-xl font-bold text-blue-600">{formatPrice(orderDetails.finalTotal)}</p>
            </div>
            {/* Action Buttons Logic (simplified) */}
            <div className="flex gap-2">
               {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus('processing')}
                        disabled={updating}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        {updating ? '...' : 'Xác nhận đơn'}
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus('shipped')}
                        disabled={updating}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {updating ? '...' : 'Giao hàng'}
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        onClick={() => updateOrderStatus('delivered')}
                        disabled={updating}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                      >
                        {updating ? '...' : 'Hoàn thành'}
                      </button>
                    )}
                  </>
               )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Products Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                <h2 className="font-bold text-sm">Danh sách sản phẩm</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      <img src={getImageUrl(item.productImage)} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate uppercase">{item.productName}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{item.productBrand}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                <h2 className="font-bold text-sm">Chi tiết thanh toán</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium text-gray-900">{formatPrice(orderDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Thuế VAT (10%)</span>
                  <span className="font-medium text-gray-900">+{formatPrice(orderDetails.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-green-600 italic">
                    {orderDetails.shippingFee === 0 ? 'Miễn phí' : `+${formatPrice(orderDetails.shippingFee)}`}
                  </span>
                </div>
                {orderDetails.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-medium">
                    <span>Giảm giá ({order.voucherCode})</span>
                    <span>-{formatPrice(orderDetails.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-blue-600">{formatPrice(orderDetails.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right 1/3 */}
          <div className="space-y-6">
            
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <h2 className="font-bold text-sm">Khách hàng</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Họ tên</p>
                  <p className="text-sm font-bold text-gray-900">{order.customerInfo?.fullName || order.userId?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Liên hệ</p>
                  <p className="text-sm text-gray-600">{order.customerInfo?.phone || order.phone}</p>
                  <p className="text-sm text-gray-600">{order.customerInfo?.email || order.email}</p>
                </div>
                <div className="pt-3 border-t border-gray-50">
                  <div className="flex gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Địa chỉ nhận hàng</p>
                      <p className="text-xs text-gray-600 leading-relaxed italic">{order.customerInfo?.address || order.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                <Info size={16} className="text-gray-400" />
                <h2 className="font-bold text-sm">Trạng thái giao dịch</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Phương thức</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Thanh toán</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                      {order.paymentStatus === 'paid' ? 'Đã thu tiền' : 'Chưa thanh toán'}
                   </span>
                </div>
              </div>
            </div>

            {/* Notes Section if any */}
            {order.customerInfo?.notes && (
              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Ghi chú từ khách</p>
                <p className="text-xs text-blue-700 italic leading-relaxed">"{order.customerInfo.notes}"</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
