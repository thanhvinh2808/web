// app/admin/orders/[id]/page.tsx
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
  paymentStatus?: 'paid' | 'unpaid';
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
  pending: 'Chờ Duyệt',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao Hàng',
  delivered: 'Hoàn Thành',
  cancelled: 'Hủy'
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateOrderDetails = (order: Order | null) => {
    if (!order || !order.items) {
      return {
        subtotal: 0,
        vatAmount: 0,
        shippingFee: 0,
        discountAmount: 0,
        finalTotal: 0
      };
    }

    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const vatAmount = Math.round(subtotal * 0.01);

    const calculateShippingFee = () => {
      if (subtotal >= 1000000) return 0;
      if (subtotal >= 500000) return 30000;
      return 50000;
    };
    const shippingFee = calculateShippingFee();

    const discountAmount = order.discountAmount || 0;
    const finalTotal = subtotal + shippingFee + vatAmount - discountAmount;

    return {
      subtotal,
      vatAmount,
      shippingFee,
      discountAmount,
      finalTotal
    };
  };

  useEffect(() => {
    params.then(({ id }) => {
      console.log('📦 Order ID from params:', id);
      setOrderId(id);
    }).catch(err => {
      console.error('❌ Error unwrapping params:', err);
      setError('Lỗi khi tải thông tin đơn hàng');
    });
  }, [params]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('❌ No token found');
        setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
        router.push('/admin');
        return;
      }

      console.log('🌐 Fetching:', `${API_URL}/api/admin/orders/${orderId}`);
      
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', res.status);

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
      console.log('✅ Order data:', data);

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

  // ✅ SỬA: LẤY TOKEN TỪNG LẦN GỌI HÀM
  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId) return;

    try {
      setUpdating(true);

      // ✅ LẤY TOKEN TỪ LOCALSTORAGE
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        alert('❌ Vui lòng đăng nhập lại!');
        router.push('/admin');
        return;
      }

      console.log('📤 Gửi request cập nhật trạng thái:', {
        orderId,
        newStatus,
        url: `${API_URL}/api/admin/orders/${orderId}/status`
      });

      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📥 Response status:', res.status);
      console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));
      
      // ✅ KIỂM TRA RESPONSE TEXT TRƯỚC KHI PARSE JSON
      const text = await res.text();
      console.log('📥 Response text:', text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON:', parseError);
        console.error('Raw response:', text);
        alert('❌ Server trả về dữ liệu không hợp lệ');
        return;
      }

      console.log('📥 Parsed data:', data);

      if (!res.ok) {
        alert(`❌ HTTP ${res.status}: ${data.message || 'Cập nhật thất bại'}`);
        return;
      }

      if (!data.success) {
        alert(`❌ ${data.message || 'Cập nhật thất bại'}`);
        return;
      }

      // ✅ BACKEND TRẢ VỀ data.data HOẶC data.order
      const updatedOrder = data.data || data.order;
      
      if (updatedOrder) {
        setOrder(updatedOrder);
        alert('✅ Cập nhật trạng thái thành công!');
      } else {
        console.error('⚠️ Backend không trả về order trong response:', data);
        alert('⚠️ Đang tải lại dữ liệu...');
        // Reload lại order để lấy dữ liệu mới nhất
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
            onClick={() => router.push('/admin/orders')} 
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Quay lại danh sách
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
            onClick={() => router.push('/admin')} 
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-teal-600 hover:text-teal-700 mb-3 flex items-center gap-2 font-medium"
          >
            ← Quay lại danh sách đơn hàng
          </button>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Mã đơn hàng: <span className="text-teal-600">#{order._id.slice(-8).toUpperCase()}</span>
                </h1>
                <p className="text-gray-600">Ngày đặt: {formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-teal-600">{formatPrice(orderDetails.finalTotal)}</p>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {statusLabels[order.status]}
                  </span>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
  order.paymentStatus === 'paid' || order.status === 'delivered' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}`}>
  {order.paymentStatus === 'paid' || order.status === 'delivered' 
    ? 'ĐÃ THANH TOÁN' 
    : 'CHƯA THANH TOÁN'}
</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left - Products */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📦</span>
                Sản phẩm ({order.items?.length || 0})
              </h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.productName}</p>
                        {item.productBrand && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.productBrand}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800 text-lg">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Không có sản phẩm</p>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span>
                Tổng quan đơn hàng
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính:</span>
                  <span className="font-medium">{formatPrice(orderDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>VAT (1%):</span>
                  <span className="font-medium">{formatPrice(orderDetails.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Phí vận chuyển:</span>
                  <span className={`font-medium ${orderDetails.shippingFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {orderDetails.shippingFee === 0 ? 'Miễn phí' : formatPrice(orderDetails.shippingFee)}
                  </span>
                </div>
                {orderDetails.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>
                      Giảm giá
                      {order.voucherCode && <span className="text-xs text-gray-500"> ({order.voucherCode})</span>}:
                    </span>
                    <span className="font-medium text-red-600">-{formatPrice(orderDetails.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {formatPrice(orderDetails.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {order.customerInfo?.notes && (
              <div className="bg-yellow-50 rounded-lg p-6 shadow-sm border border-yellow-200">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📝</span>
                  Ghi chú từ khách hàng
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{order.customerInfo.notes}</p>
              </div>
            )}
          </div>

          {/* Right - Customer Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👤</span>
                Thông tin khách hàng
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Họ và tên</label>
                    <p className="font-semibold text-gray-800">
                      {order.customerInfo?.fullName || order.userId?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📱</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Số điện thoại</label>
                    <p className="font-semibold text-gray-800">
                      {order.customerInfo?.phone || order.phone || order.userId?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✉️</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Email</label>
                    <p className="font-semibold text-gray-800 break-all">
                      {order.customerInfo?.email || order.email || order.userId?.email || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Địa chỉ giao hàng</label>
                    <p className="font-semibold text-gray-800 leading-relaxed">
                      {order.customerInfo?.address || order.address || 'Không có địa chỉ'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💳</span>
                Thông tin thanh toán
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block">Phương thức</label>
                  <p className="font-semibold text-gray-800">
                    { order.paymentMethod === 'momo' 
                      ? 'Đã thanh toán qua MoMo' 
                      : order.paymentMethod === 'banking'
                      ? 'Đã chuyển khoản qua ngân hàng'
                      :'Thanh toán khi nhận hàng'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Trạng thái</label>
                  <div className="flex items-center gap-2 mt-1">
                    {order.paymentStatus === 'paid' || order.status === 'delivered' ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <p className="font-semibold text-green-600">Đã thanh toán</p>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <p className="font-semibold text-red-600">Chưa thanh toán</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg p-6 shadow-sm border-2 border-teal-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Quản lý đơn hàng
              </h3>
              <div className="space-y-2">
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus('processing')}
                        disabled={updating}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                      >
                        {updating ? 'Đang cập nhật...' : '✓ Xác nhận đơn hàng'}
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus('shipped')}
                        disabled={updating}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                      >
                        {updating ? 'Đang cập nhật...' : '🚚 Bắt đầu giao hàng'}
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus('delivered')}
                          disabled={updating}
                          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                          {updating ? 'Đang cập nhật...' : '✓ Xác nhận đã giao'}
                        </button>
                        {order.paymentStatus !== 'paid' && (
                          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                            💡 <strong>Lưu ý:</strong> Khi bấm "Xác nhận đã giao", trạng thái thanh toán sẽ tự động chuyển thành "Đã thanh toán"
                          </div>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => updateOrderStatus('cancelled')}
                      disabled={updating}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      {updating ? 'Đang cập nhật...' : '✕ Hủy đơn hàng'}
                    </button>
                  </>
                )}
                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <div className="bg-gray-100 text-gray-600 text-center py-3 px-4 rounded-lg font-medium">
                    Đơn hàng không thể cập nhật
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}