// app/admin/orders/[id]/page.tsx
'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// ✅ QUAN TRỌNG: Hardcode trực tiếp để tránh nhầm lẫn
const BACKEND_API_URL = 'http://localhost:5000';

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
  pending: 'Chờ Duyệt',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao Hàng',
  delivered: 'Hoàn Thành',
  cancelled: 'Hủy'
};

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const orderId = params.id;
  
  // ✅ ĐẢM BẢO KHÔNG THỂ SAI PORT - ƯU TIÊN BACKEND 5000
  const API_URL = 'http://localhost:5000';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CHỈ CHẠY Ở CLIENT
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

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
   const finalTotal = order.totalAmount - discountAmount + vatAmount + shippingFee;

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

      const fetchUrl = `${BACKEND_API_URL}/api/admin/orders/${orderId}`;
      console.log('🌐 Calling Backend:', fetchUrl);
      
      const res = await fetch(fetchUrl, {
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

      const updateUrl = `${BACKEND_API_URL}/api/admin/orders/${orderId}/status`;
      console.log('📤 Gửi request cập nhật trạng thái:', {
        orderId,
        newStatus,
        url: updateUrl
      });

      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📥 Response status:', res.status);
      console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));
      
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

      const updatedOrder = data.data || data.order;
      
      if (updatedOrder) {
        setOrder(updatedOrder);
        alert('✅ Cập nhật trạng thái thành công!');
      } else {
        console.error('⚠️ Backend không trả về order trong response:', data);
        alert('⚠️ Đang tải lại dữ liệu...');
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

      <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-gray-900">

        <div className="max-w-7xl mx-auto">

          

          {/* TOP NAVIGATION & ACTIONS */}

          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div>

              <button

                onClick={() => router.push('/admin')}

                className="text-[10px] font-black text-gray-400 hover:text-black mb-4 flex items-center gap-2 uppercase tracking-[0.3em] transition-colors group"

              >

                <span className="group-hover:-translate-x-1 transition-transform">←</span> Quay lại danh sách

              </button>

              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">

                Chi tiết <span className="text-primary">Đơn hàng.</span>

              </h1>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">

                Mã hệ thống: <span className="text-black font-mono">#{order._id.toUpperCase()}</span>

              </p>

            </div>

  

            <div className="flex items-center gap-4">

               <div className="text-right hidden md:block">

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng thanh toán</p>

                  <p className="text-3xl font-black text-primary italic tracking-tighter leading-none">{formatPrice(orderDetails.finalTotal)}</p>

               </div>

               <div className="h-12 w-px bg-gray-100 mx-2 hidden md:block"></div>

               <span className={`px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] border-2 ${

                  order.status === 'delivered' ? 'border-green-500 text-green-600' :

                  order.status === 'cancelled' ? 'border-red-500 text-red-600' :

                  'border-black text-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'

               }`}>

                  {statusLabels[order.status]}

               </span>

            </div>

          </div>

  

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            

            {/* LEFT: PRODUCTS & SUMMARY */}

            <div className="lg:col-span-8 space-y-12">

              

              {/* PRODUCT LIST */}

              <section>

                <div className="flex items-center gap-3 mb-8">

                   <h2 className="text-xl font-black italic uppercase tracking-tight">Sản phẩm ({order.items?.length || 0})</h2>

                   <div className="h-px flex-1 bg-gray-100"></div>

                </div>

                

                {order.items && order.items.length > 0 ? (

                  <div className="space-y-6">

                    {order.items.map((item, idx) => (

                      <div key={idx} className="flex gap-6 pb-6 border-b border-gray-50 last:border-0 group">

                        <div className="w-24 h-24 bg-gray-50 border border-gray-100 flex-shrink-0 relative overflow-hidden">

                          {item.productImage ? (

                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />

                          ) : (

                            <div className="w-full h-full flex items-center justify-center text-gray-200 font-black">NO IMG</div>

                          )}

                          <span className="absolute top-0 left-0 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">Elite</span>

                        </div>

                        

                        <div className="flex-1 flex flex-col justify-between">

                          <div>

                            <h3 className="font-black text-lg uppercase tracking-tight italic leading-tight group-hover:text-primary transition-colors cursor-pointer">{item.productName}</h3>

                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Brand: <span className="text-black">{item.productBrand || 'N/A'}</span></p>

                          </div>

                          <div className="flex items-end justify-between">

                             <p className="text-sm font-bold text-gray-500 italic">

                               {item.quantity} x <span className="text-black">{formatPrice(item.price)}</span>

                             </p>

                             <p className="font-black text-xl italic tracking-tighter">

                               {formatPrice(item.price * item.quantity)}

                             </p>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <div className="p-10 border-2 border-dashed border-gray-100 text-center uppercase font-bold text-gray-300 text-xs tracking-[0.3em]">Không có dữ liệu sản phẩm</div>

                )}

              </section>

  

              {/* ORDER OVERVIEW & TOTALS */}

              <section className="bg-black text-white p-8 md:p-12 relative overflow-hidden">

                 {/* Decorative background element */}

                 <div className="absolute top-0 right-0 text-[120px] font-black italic opacity-[0.03] select-none pointer-events-none translate-x-1/4 -translate-y-1/4">FOOTMARK</div>

                 

                 <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-10 border-b border-white/10 pb-4">Tóm tắt chi phí.</h2>

                 

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    <div className="space-y-4">

                       <div className="flex justify-between items-center border-b border-white/5 pb-2">

                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tạm tính hàng hóa</span>

                          <span className="font-bold italic">{formatPrice(orderDetails.subtotal)}</span>

                       </div>

                       <div className="flex justify-between items-center border-b border-white/5 pb-2">

                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Thuế VAT (10%)</span>

                          <span className="font-bold italic">+{formatPrice(orderDetails.vatAmount)}</span>

                       </div>

                       <div className="flex justify-between items-center border-b border-white/5 pb-2">

                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phí vận chuyển</span>

                          <span className={`font-bold italic ${orderDetails.shippingFee === 0 ? 'text-green-400' : ''}`}>

                             {orderDetails.shippingFee === 0 ? 'Miễn phí' : `+${formatPrice(orderDetails.shippingFee)}`}

                          </span>

                       </div>

                       {orderDetails.discountAmount > 0 && (

                          <div className="flex justify-between items-center text-primary-light">

                             <span className="text-[10px] font-black uppercase tracking-widest">Mã giảm giá ({order.voucherCode})</span>

                             <span className="font-black italic">-{formatPrice(orderDetails.discountAmount)}</span>

                          </div>

                       )}

                    </div>

  

                    <div className="flex flex-col justify-end items-end md:text-right">

                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Final Total Amount</span>

                       <span className="text-6xl font-black text-primary italic tracking-tighter leading-none mb-4">{formatPrice(orderDetails.finalTotal)}</span>

                       <div className="flex items-center gap-2">

                          <span className="w-3 h-3 bg-primary animate-pulse"></span>

                          <span className="text-[10px] font-black uppercase tracking-widest">Đã xác thực bởi hệ thống</span>

                       </div>

                    </div>

                 </div>

              </section>

  

              {/* CUSTOMER NOTES */}

              {order.customerInfo?.notes && (

                <section className="border-l-4 border-primary bg-blue-50/30 p-6">

                  <h2 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Ghi chú từ khách hàng:</h2>

                  <p className="text-sm font-medium text-gray-700 italic leading-relaxed">"{order.customerInfo.notes}"</p>

                </section>

              )}

            </div>

  

            {/* RIGHT: CUSTOMER INFO & MANAGEMENT */}

            <div className="lg:col-span-4 space-y-8">

              

              {/* CUSTOMER PROFILE */}

              <div className="bg-white border-2 border-black p-8">

                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2">

                  Thông tin khách.

                </h3>

                

                <div className="space-y-6">

                  <div className="group">

                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Họ và tên người nhận</label>

                    <p className="font-black text-lg uppercase tracking-tight">{order.customerInfo?.fullName || order.userId?.name || 'N/A'}</p>

                  </div>

                  

                  <div className="group">

                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Liên hệ</label>

                    <p className="font-bold text-sm text-gray-700">{order.customerInfo?.phone || order.phone || 'N/A'}</p>

                    <p className="font-bold text-sm text-gray-700 lowercase">{order.customerInfo?.email || order.email || 'N/A'}</p>

                  </div>

                  

                  <div className="group pt-4 border-t border-gray-100">

                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Địa chỉ giao hàng</label>

                    <p className="font-medium text-sm text-gray-600 leading-relaxed italic">

                      {order.customerInfo?.address || order.address || 'Không có địa chỉ'}

                    </p>

                  </div>

                </div>

              </div>

  

              {/* PAYMENT STATUS */}

              <div className="bg-gray-50 p-8 border border-gray-100">

                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-400">Payment Information</h3>

                <div className="space-y-4">

                  <div className="flex justify-between items-center">

                     <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Phương thức:</span>

                     <span className="text-xs font-black uppercase tracking-widest italic">{order.paymentMethod}</span>

                  </div>

                  <div className="flex justify-between items-center">

                     <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Trạng thái:</span>

                    <span className={`text-[10px] font-black px-3 py-1 uppercase tracking-widest ${
  order.paymentStatus === 'paid'
    ? 'bg-green-100 text-green-700'
    : order.paymentStatus === 'refunded'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-red-100 text-red-700'
}`}>

                        {order.paymentStatus === 'paid'
    ? 'ĐÃ THANH TOÁN'
    : order.paymentStatus === 'refunded'
    ? 'ĐÃ HOÀN TIỀN'
    : 'CHƯA THANH TOÁN'}

                     </span>

                  </div>

                </div>

              </div>

  

              {/* ORDER ACTION CENTER */}

              <div className="bg-primary p-1 md:p-1.5 shadow-xl">

                 <div className="bg-white p-8 border border-primary/20">

                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 text-black">

                      Quản lý <span className="text-primary">Trạng thái.</span>

                    </h3>

                    

                    <div className="space-y-3">

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (

                        <>

                          {order.status === 'pending' && (

                            <button

                              onClick={() => updateOrderStatus('processing')}

                              disabled={updating}

                              className="w-full bg-black text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"

                            >

                              {updating ? '...' : 'Tiếp nhận xử lý'} <span className="group-hover:translate-x-1 transition-transform">→</span>

                            </button>

                          )}

                          {order.status === 'processing' && (

                            <button

                              onClick={() => updateOrderStatus('shipped')}

                              disabled={updating}

                              className="w-full bg-black text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"

                            >

                              {updating ? '...' : 'Bắt đầu giao hàng'} <span className="group-hover:translate-x-1 transition-transform">→</span>

                            </button>

                          )}

                          {order.status === 'shipped' && (

                            <button

                              onClick={() => updateOrderStatus('delivered')}

                              disabled={updating}

                              className="w-full bg-green-600 text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 hover:bg-green-700 transition-all disabled:opacity-50"

                            >

                              {updating ? '...' : 'Xác nhận hoàn thành'}

                            </button>

                          )}

                          <button

                            onClick={() => updateOrderStatus('cancelled')}

                            disabled={updating}

                            className="w-full bg-white border-2 border-red-500 text-red-600 font-black uppercase text-[11px] tracking-[0.2em] py-4 hover:bg-red-50 transition-all disabled:opacity-50"

                          >

                            {updating ? '...' : 'Hủy đơn hàng'}

                          </button>

                        </>

                      )}

                      

                      {(order.status === 'delivered' || order.status === 'cancelled') && (

                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 text-center py-6 px-4 font-black uppercase text-[10px] tracking-[0.3em]">

                          Hồ sơ đơn hàng đã đóng

                        </div>

                      )}

                    </div>

                 </div>

              </div>

  

            </div>

          </div>

        </div>

      </div>

    );

  }

  