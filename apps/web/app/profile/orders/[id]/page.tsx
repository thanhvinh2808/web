"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrders, Order } from "../../../contexts/OrderContext";
import Link from "next/link";
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';

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
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getOrderById, updateOrderInContext } = useOrders();
  const { addToCart } = useCart();
  const { socket, isConnected } = useSocket();
  
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const cachedOrder = getOrderById(orderId);
    if (cachedOrder) setOrder(cachedOrder);

    const fetchFreshOrder = async () => {
       if (!user) return;
       try {
          const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
             headers: { 'Authorization': `Bearer ${user._id}` }
          });
          if (res.ok) {
             const data = await res.json();
             // API return format is { success: true, order: ... }
             if (data.success && data.order) {
                setOrder(data.order);
             } else {
                setOrder(data); // fallback
             }
          }
       } catch (error) {
          console.error("Failed to fetch order:", error);
       }
    };
    fetchFreshOrder();
  }, [orderId, user?._id, getOrderById]);

  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    const handleStatusUpdate = (data: any) => {
      if (data.orderId === orderId) {
        console.log('⚡ Order status update received:', data);
        setOrder(prev => prev ? { ...prev, status: data.status, paymentStatus: data.paymentStatus } : null);
        updateOrderInContext(orderId, { status: data.status, paymentStatus: data.paymentStatus });
        toast.success(`Trạng thái đơn hàng: ${data.status}`);
      }
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [socket, isConnected, orderId, updateOrderInContext]);

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
       const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
          method: 'PUT',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${user?._id}`
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

  const handleReorder = async () => {
     if (!order) return;
           setReorderingId(order._id || '');
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
        case 'processing': return 'bg-blue-100 text-primary';
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
         
         <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black font-medium transition text-sm uppercase tracking-wide">
               <ArrowLeft size={18}/> Quay lại
            </button>
            <div className="text-right">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã đơn hàng</p>
               <p className="text-xl font-mono font-black text-black">#{order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : 'N/A')}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
               
               <div className="bg-white rounded-none p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-lg font-black text-gray-900 mb-1 uppercase tracking-wide">Trạng thái đơn hàng</h2>
                        <p className="text-xs text-gray-500 font-medium">Cập nhật lần cuối: {new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN')}</p>
                     </div>
                     <span className={`px-4 py-2 rounded-none font-black text-[10px] uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                     </span>
                  </div>
                  
                  <div className="relative flex justify-between mt-10 px-2">
                     {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                        const currentIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                        const isCompleted = idx <= currentIdx;
                        const isCancelled = order.status === 'cancelled';
                        
                        return (
                           <div key={step} className="flex flex-col items-center relative z-10">
                              <div className={`w-6 h-6 rounded-none flex items-center justify-center border-2 transition-all rotate-45 ${
                                 isCancelled ? 'border-gray-200 bg-gray-100 text-gray-400' :
                                 isCompleted ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-300'
                              }`}>
                                 {isCompleted && <div className="w-2 h-2 bg-white rounded-none"/>}
                              </div>
                              <span className={`text-[8px] font-bold uppercase mt-4 tracking-widest ${isCompleted && !isCancelled ? 'text-primary' : 'text-gray-400'}`}>
                                 {getStatusLabel(step)}
                              </span>
                           </div>
                        )
                     })}
                     <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-0">
                        <div 
                           className="h-full bg-primary transition-all duration-500" 
                           style={{ width: order.status === 'cancelled' ? '0%' : `${(['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) / 3) * 100}%` }}
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                     <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <Package size={18}/> Sản phẩm ({order.items.length})
                     </h3>
                  </div>
                  <div className="p-6 space-y-6">
                     {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                           <div className="w-20 h-20 bg-gray-50 rounded-none overflow-hidden border border-gray-200 flex-shrink-0">
                              <img src={item.productImage} alt="" className="w-full h-full object-cover"/>
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold text-gray-900 line-clamp-1 uppercase tracking-tighter italic text-sm">{item.productName}</h4>
                              <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">{item.productBrand}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-black italic text-sm">{item.price.toLocaleString('vi-VN')}₫</p>
                              <p className="text-xs text-gray-500 font-bold">x{item.quantity}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>

            <div className="space-y-6">
               
               <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6">
                  <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                     <FileText size={18}/> Thanh toán
                  </h3>
                  
                  <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                     <div className="flex justify-between text-gray-500 font-medium text-xs uppercase tracking-wide">
                        <span>Tạm tính</span>
                        <span className="text-black font-bold">{((order.totalAmount || 0) - (order.shippingFee||0) + (order.discountAmount||0)).toLocaleString()}₫</span>
                     </div>
                     <div className="flex justify-between text-gray-500 font-medium text-xs uppercase tracking-wide">
                        <span>Phí vận chuyển</span>
                        <span className="text-black font-bold">{(order.shippingFee||0).toLocaleString()}₫</span>
                     </div>
                     {(order.discountAmount || 0) > 0 && (
                        <div className="flex justify-between text-primary font-bold text-xs uppercase tracking-wide">
                           <span>Giảm giá</span>
                           <span>-{ (order.discountAmount || 0).toLocaleString()}₫</span>
                        </div>
                     )}
                  </div>
                  
                  <div className="flex justify-between items-end mb-1">
                     <span className="font-black text-sm uppercase tracking-tighter">Tổng cộng</span>
                     <span className="font-black text-xl text-primary italic tracking-tighter">{order.totalAmount.toLocaleString()}₫</span>
                  </div>
                  <p className="text-right text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
                     {order.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Thanh toán khi nhận hàng'}
                  </p>

                  {order.status === 'pending' && (
                     <button 
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full border-2 border-red-100 text-red-600 font-bold py-3 rounded-none hover:bg-red-50 transition text-xs uppercase tracking-widest mb-3"
                     >
                        Hủy đơn hàng
                     </button>
                  )}
                  
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                     <button 
                        onClick={handleReorder}
                        className="w-full bg-primary text-white font-bold py-3 rounded-none hover:bg-primary-dark transition text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                     >
                        <ShoppingCart size={16}/> Mua lại
                     </button>
                  )}
               </div>

               <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 space-y-4">
                  <h3 className="font-black text-gray-900 mb-2 uppercase tracking-wide text-sm">Thông tin nhận hàng</h3>
                  
                  <div className="flex items-start gap-3">
                     <MapPin className="text-gray-400 mt-0.5" size={16}/>
                     <div>
                        <p className="font-bold text-sm uppercase tracking-wide">{order.customerInfo.fullName}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{order.customerInfo.address}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <Phone className="text-gray-400" size={16}/>
                     <p className="text-xs font-bold tracking-wider">{order.customerInfo.phone}</p>
                  </div>
               </div>

            </div>
         </div>

      </div>

      {showCancelConfirm && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-none max-w-md w-full p-8 animate-in zoom-in-95 border border-gray-200">
               <h3 className="text-xl font-black mb-4 uppercase tracking-tighter italic">Xác nhận hủy đơn?</h3>
               <p className="text-gray-500 text-xs font-medium mb-6 uppercase tracking-wide">
                  Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
               </p>
               
               <textarea 
                  className="w-full border border-gray-300 rounded-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none mb-6 h-24 resize-none font-medium"
                  placeholder="Lý do hủy đơn..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
               />
               
               <div className="flex gap-4">
                  <button 
                     onClick={() => setShowCancelConfirm(false)}
                     className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition"
                  >
                     Đóng
                  </button>
                  <button 
                     onClick={handleCancelOrder}
                     disabled={isCancelling || !cancelReason.trim()}
                     className="flex-1 bg-red-600 text-white py-3 rounded-none font-bold text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition"
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