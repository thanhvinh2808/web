"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrders, Order } from "../../../contexts/OrderContext";
import Link from "next/link";
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import io from 'socket.io-client';

import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  ShoppingCart,
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  Calendar,
  FileText,
  Loader2,
  Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getOrderById, updateOrderInContext } = useOrders();
  const { addToCart } = useCart();
  
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // ✅ 1. Load Order Data
  useEffect(() => {
    // Ưu tiên load từ Context trước cho nhanh
    const cachedOrder = getOrderById(orderId);
    if (cachedOrder) setOrder(cachedOrder);

    // Sau đó fetch fresh data từ API
    const fetchFreshOrder = async () => {
       if (!user?.token) return;
       try {
          const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
             headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (res.ok) {
             const data = await res.json();
             setOrder(data);
          }
       } catch (error) {
          console.error("Failed to fetch order:", error);
       }
    };
    fetchFreshOrder();
  }, [orderId, user?.token]);

  // ✅ 2. Real-time Update
  useEffect(() => {
    if (!user?.id || !orderId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinUserRoom', user.id);
    });

    socket.on('orderStatusUpdated', (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status, paymentStatus: data.paymentStatus } : null);
        updateOrderInContext(orderId, { status: data.status, paymentStatus: data.paymentStatus });
        toast.success(`Trạng thái đơn hàng đã cập nhật: ${data.status}`);
      }
    });

    return () => { socket.disconnect(); };
  }, [user?.id, orderId]);

  // ✅ 3. Handle Cancel
  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
       const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
          method: 'PUT',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ cancelReason })
       });

       if (!res.ok) throw new Error('Không thể hủy đơn hàng');
       
       const data = await res.json();
       setOrder(data.order);
       updateOrderInContext(orderId, data.order);
       toast.success('Đã hủy đơn hàng thành công');
       setShowCancelConfirm(false);
    } catch (error) {
       toast.error('Lỗi khi hủy đơn hàng');
    } finally {
       setIsCancelling(false);
    }
  };

  // ✅ 4. Handle Reorder
  const handleReorder = async () => {
     if (!order) return;
           setReorderingId(order._id || '');     // Giả lập add nhanh, thực tế nên check stock
     order.items.forEach(item => {
        addToCart({
           _id: item.productId,
           name: item.productName,
           price: item.price,
           image: item.productImage,
           // @ts-ignore
           variants: [] 
        }, item.quantity);
     });
     
     toast.success('Đã thêm vào giỏ hàng!');
     setTimeout(() => router.push('/cart'), 500);
     setReorderingId(null);
  };

  if (!order) return (
     <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32}/>
     </div>
  );

  const getStatusColor = (status: string) => {
     switch(status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'shipped': return 'bg-purple-100 text-purple-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
     }
  };

  const getStatusLabel = (status: string) => {
     const labels: any = {
        pending: 'Chờ xác nhận',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        delivered: 'Hoàn thành',
        cancelled: 'Đã hủy'
     };
     return labels[status] || status;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
         
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black font-medium transition">
               <ArrowLeft size={20}/> Quay lại
            </button>
            <div className="text-right">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã đơn hàng</p>
               <p className="text-xl font-mono font-bold text-black">#{order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : 'N/A')}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Main Info) */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* Status Card */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Trạng thái đơn hàng</h2>
                        <p className="text-sm text-gray-500">Cập nhật lần cuối: {new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN')}</p>
                     </div>
                     <span className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                     </span>
                  </div>
                  
                  {/* Timeline (Simplified) */}
                  <div className="relative flex justify-between mt-8 px-2">
                     {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                        const currentIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                        const isCompleted = idx <= currentIdx;
                        const isCancelled = order.status === 'cancelled';
                        
                        return (
                           <div key={step} className="flex flex-col items-center relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                 isCancelled ? 'border-gray-200 bg-gray-100 text-gray-400' :
                                 isCompleted ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-300'
                              }`}>
                                 {isCompleted ? <CheckCircle size={14}/> : <div className="w-2 h-2 rounded-full bg-gray-300"/>}
                              </div>
                              <span className={`text-[10px] font-bold uppercase mt-2 ${isCompleted && !isCancelled ? 'text-black' : 'text-gray-400'}`}>
                                 {getStatusLabel(step)}
                              </span>
                           </div>
                        )
                     })}
                     {/* Progress Bar */}
                     <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-100 -z-0">
                        <div 
                           className="h-full bg-black transition-all duration-500" 
                           style={{ width: order.status === 'cancelled' ? '0%' : `${(['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) / 3) * 100}%` }}
                        />
                     </div>
                  </div>
               </div>

               {/* Products List */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={20}/> Sản phẩm ({order.items.length})
                     </h3>
                  </div>
                  <div className="p-6 space-y-6">
                     {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                           <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                              <img src={item.productImage} alt="" className="w-full h-full object-cover"/>
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold text-gray-900 line-clamp-1">{item.productName}</h4>
                              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{item.productBrand}</p>
                              {/* TODO: Show Size if backend saves variant info */}
                              {/* {item.variant && <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs font-bold mt-2">Size: {item.variant}</span>} */}
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-black">{item.price.toLocaleString('vi-VN')}₫</p>
                              <p className="text-sm text-gray-500">x{item.quantity}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>

            {/* Right Column (Summary & Actions) */}
            <div className="space-y-6">
               
               {/* Order Summary */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <FileText size={20}/> Thanh toán
                  </h3>
                  
                  <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                     <div className="flex justify-between text-gray-600">
                        <span>Tạm tính</span>
                        <span>{(order.totalAmount - (order.shippingFee||0) + (order.discountAmount||0)).toLocaleString()}₫</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển</span>
                        <span>{(order.shippingFee||0).toLocaleString()}₫</span>
                     </div>
                     {(order.discountAmount || 0) > 0 && (
                        <div className="flex justify-between text-blue-600">
                           <span>Giảm giá</span>
                                                       <span>-{ (order.discountAmount || 0).toLocaleString()}₫</span>                        </div>
                     )}
                  </div>
                  
                  <div className="flex justify-between items-end mb-1">
                     <span className="font-black text-lg uppercase">Tổng cộng</span>
                     <span className="font-black text-2xl text-blue-600">{order.totalAmount.toLocaleString()}₫</span>
                  </div>
                  <p className="text-right text-xs text-gray-400 mb-6">
                     {order.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Thanh toán khi nhận hàng'}
                  </p>

                  {/* Actions */}
                  {order.status === 'pending' && (
                     <button 
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full border-2 border-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition text-sm uppercase tracking-wider mb-3"
                     >
                        Hủy đơn hàng
                     </button>
                  )}
                  
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                     <button 
                        onClick={handleReorder}
                        className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-stone-800 transition text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                     >
                        <ShoppingCart size={16}/> Mua lại
                     </button>
                  )}
               </div>

               {/* Customer Info */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 mb-2">Thông tin nhận hàng</h3>
                  
                  <div className="flex items-start gap-3">
                     <MapPin className="text-gray-400 mt-0.5" size={18}/>
                     <div>
                        <p className="font-bold text-sm">{order.customerInfo.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{order.customerInfo.address}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <Phone className="text-gray-400" size={18}/>
                     <p className="text-sm font-medium">{order.customerInfo.phone}</p>
                  </div>
               </div>

            </div>
         </div>

      </div>

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in zoom-in-95">
               <h3 className="text-xl font-bold mb-4">Xác nhận hủy đơn?</h3>
               <p className="text-gray-500 text-sm mb-4">
                  Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
               </p>
               
               <textarea 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none mb-6 h-24 resize-none"
                  placeholder="Lý do hủy đơn..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
               />
               
               <div className="flex gap-3">
                  <button 
                     onClick={() => setShowCancelConfirm(false)}
                     className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                     Đóng
                  </button>
                  <button 
                     onClick={handleCancelOrder}
                     disabled={isCancelling || !cancelReason.trim()}
                     className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition"
                  >
                     {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
