// app/profile/orders/[id]/page.tsx
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
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getOrderById, updateOrderInContext } = useOrders();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { addToCart } = useCart();
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(getOrderById(orderId) || null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // ✅ SOCKET.IO - REAL-TIME UPDATES
  useEffect(() => {
    if (!user?.id || !orderId) return;

    console.log('🔌 Connecting to Socket.io for order detail...');
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      socket.emit('joinUserRoom', user.id);
    });

    socket.on('orderStatusUpdated', (data) => {
      console.log('📬 Received order update:', data);
      
      // ✅ CHỈ CẬP NHẬT NẾU LÀ ĐƠN HÀNG ĐANG XEM
      if (data.orderId === orderId) {
        setOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            paymentStatus: data.paymentStatus || (data.isPaid ? 'paid' : 'unpaid'),
            isPaid: data.paymentStatus === 'paid' || data.isPaid // Backward compatibility
          };
        });

        // Cập nhật trong context
        updateOrderInContext(orderId, {
          status: data.status,
          paymentStatus: data.paymentStatus,
          isPaid: data.paymentStatus === 'paid'
        });
        // ✅ HÀM MUA LẠI ĐƠN HÀNG
 
        
        // Hiển thị thông báo
        const statusLabels: { [key: string]: string } = {
          pending: 'Chờ xử lý',
          processing: 'Đang xử lý',
          shipped: 'Đang giao hàng',
          delivered: 'Đã giao hàng',
          cancelled: 'Đã hủy'
        };
        const statusText = statusLabels[data.status] || data.status;
             
        alert(`🔔 Đơn hàng đã được cập nhật: ${statusText}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    return () => {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
    };
  }, [user?.id, orderId, updateOrderInContext]);

  // ✅ CẬP NHẬT ORDER KHI CONTEXT THAY ĐỔI
  useEffect(() => {
    const updatedOrder = getOrderById(orderId);
    if (updatedOrder) {
      setOrder(updatedOrder);
    }
  }, [orderId, getOrderById]);
  //mua lại
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
  
  const isCompleted = order?.status === 'delivered';
  const isReordering = reorderingId === (order?._id || order?.id);
  


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateOrderSubtotal = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const orderSubtotal = calculateOrderSubtotal();
  const vatAmount = Math.round(orderSubtotal * 0.01);

  const calculateShippingFee = () => {
    if (orderSubtotal >= 1000000) return 0;
    if (orderSubtotal >= 500000) return 30000;
    return 50000;
  };
  const shippingFee = calculateShippingFee();

  const orderDiscountAmount = order?.discountAmount || 0;
  const finalTotal = orderSubtotal + shippingFee + vatAmount - orderDiscountAmount;

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">Đơn hàng không tồn tại hoặc đã bị xóa</p>
          <button
            onClick={() => router.push('/profile/orders')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Chờ xử lý',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          bgColor: 'bg-yellow-50'
        };
      case 'processing':
        return {
          label: 'Đang xử lý',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle,
          bgColor: 'bg-blue-50'
        };
      case 'shipped':
        return {
          label: 'Đang giao hàng',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Truck,
          bgColor: 'bg-purple-50'
        };
      case 'delivered':
        return {
          label: 'Hoàn thành',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          bgColor: 'bg-green-50'
        };
      case 'cancelled':
        return {
          label: 'Đã hủy',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          bgColor: 'bg-red-50'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Package,
          bgColor: 'bg-gray-50'
        };
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cod': return 'Thanh toán khi nhận hàng (COD)';
      case 'banking': return 'Chuyển khoản ngân hàng';
      case 'momo': return 'Ví điện tử MoMo';
      case 'card': return 'Thẻ tín dụng/ghi nợ';
      default: return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const getTimelineSteps = () => {
    const steps = [
      { status: 'pending', label: 'Đơn hàng đã đặt', completed: true },
      { status: 'processing', label: 'Đã xác nhận', completed: order.status !== 'pending' && order.status !== 'cancelled' },
      { status: 'shipped', label: 'Đang giao hàng', completed: order.status === 'shipped' || order.status === 'delivered' },
      { status: 'delivered', label: 'Đã giao hàng', completed: order.status === 'delivered' }
    ];

    if (order.status === 'cancelled') {
      return [
        { status: 'pending', label: 'Đơn hàng đã đặt', completed: true },
        { status: 'cancelled', label: 'Đã hủy', completed: true }
      ];
    }

    return steps;
  };

  const timelineSteps = getTimelineSteps();
  const handleCancelOrder = async () => {
    if (!order || !user) return;

    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;

    try {
      const token = user.token;
    
      if (!token) {
        alert("❌ Không tìm thấy token. Vui lòng đăng nhập lại.");
        return;
      }

      // ✅ DEBUG: Kiểm tra thông tin
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Current user:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
      console.log('📦 Order info:', {
        _id: order._id,
        userId: order.userId,
        status: order.status
      });
      console.log('🔐 Token (first 50 chars):', token.substring(0, 50) + '...');
    
      // ✅ Decode token để xem payload (chỉ debug, không dùng trong production)
      try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('🎫 Token payload:', payload);
      } catch (e) {
        console.log('⚠️ Cannot decode token');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const cancelUrl = `${SOCKET_URL}/api/orders/${orderId}/cancel`;
      console.log('🎯 Cancel URL:', cancelUrl);

      const response = await fetch(cancelUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancelReason: "Khách hàng yêu cầu hủy"
        })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        throw new Error(errorData.message || "Không thể hủy đơn hàng");
      }

      const data = await response.json();
      console.log('✅ Cancel response:', data);

      // Cập nhật order
      setOrder(data.order);
    
      if (updateOrderInContext) {
        updateOrderInContext(orderId, data.order);
      }

      alert("✅ Đơn hàng đã được hủy thành công!");
      router.push("/profile");
  
    } catch (error: any) {
      console.error("❌ Error cancelling order:", error);
      alert(error.message || "Có lỗi xảy ra khi hủy đơn hàng");
    }
  };
  // ✅ HỖ TRỢ CẢ paymentStatus VÀ isPaid
  const isOrderPaid = order.paymentStatus === 'paid' || order.status === 'delivered' || order.isPaid;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ✅ SOCKET CONNECTION INDICATOR */}
        {isConnected && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-800">Đang kết nối real-time - Bạn sẽ nhận thông báo khi đơn hàng được cập nhật</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/profile/orders')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách đơn hàng
          </button>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Chi tiết đơn hàng</h1>
              <p className="text-gray-600">Mã đơn hàng: <span className="font-mono font-semibold">#{order.orderNumber || order._id?.slice(-8)}</span></p>
            </div>
            <div className={`px-6 py-3 rounded-xl border-2 font-semibold flex items-center gap-2 ${statusConfig.color}`}>
              <StatusIcon size={24} />
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className={`${statusConfig.bgColor} rounded-xl p-6 mb-6 border border-gray-200`}>
          <h2 className="font-semibold text-lg mb-4">Trạng thái đơn hàng</h2>
          <div className="relative">
            <div className="flex justify-between">
              {timelineSteps.map((step, index) => {
                const StepConfig = getStatusConfig(step.status);
                const StepIcon = StepConfig.icon;
                const isLast = index === timelineSteps.length - 1;
                
                return (
                  <div key={step.status} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 ${step.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                        <StepIcon size={24} />
                      </div>
                      <div className={`mt-2 text-sm font-medium text-center ${step.completed ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                        {step.label}
                      </div>
                    </div>
                    {!isLast && (
                      <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-0 ${step.completed && timelineSteps[index + 1].completed
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                        }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Package size={20} />
                  Sản phẩm ({order.items.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.productName}</h3>
                      <p className="text-sm text-gray-500 mb-1">{item.productBrand}</p>
                      <p className="text-sm text-gray-600">
                        {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle size={24} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Xác nhận hủy đơn hàng</h3>
                  </div>
      
                  <p className="text-gray-600 mb-4">
                    Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                  </p>
      
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do hủy đơn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={4}
                      disabled={isCancelling}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCancelConfirm(false);
                        setCancelReason('');
                      }}
                      disabled={isCancelling}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      disabled={isCancelling || !cancelReason.trim()}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                    </button>
                  </div>
                </div>
              </div>
            )}
           
           
            
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <FileText size={20} />
                  Tổng quan đơn hàng
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính:</span>
                  <span className="font-medium">{orderSubtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (1%):</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Phí vận chuyển:</span>
                  <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                  </span>
                </div>
                {orderDiscountAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Giảm giá:</span>
                    <span className="font-medium text-red-600">-{orderDiscountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-red-600">
                      {finalTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
            {order.status === 'cancelled' && order.cancelReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Lý do hủy đơn hàng</h3>
                    <p className="text-red-800">{order.cancelReason}</p>
                  </div>
                </div>
              </div>
            )}
             {order.customerInfo?.notes && (
              <div className="bg-yellow-50 rounded-lg p-6 shadow-sm border border-yellow-200">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📝</span>
                  Ghi chú
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{order.customerInfo.notes}</p>
              </div>
            )}
            {order.status === 'pending' ? (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <XCircle size={20} className="text-red-600" />
                  Hủy đơn hàng
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Đơn hàng đang ở trạng thái chờ xử lý. Bạn có thể hủy đơn hàng nếu cần.
                </p>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Hủy đơn hàng
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
      <h3 className="font-semibold mb-2 text-lg text-gray-900">Cần hỗ trợ?</h3>
      <p className="text-sm text-gray-600 mb-6">
        Nếu bạn có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với chúng tôi.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Nút Liên Hệ - Trái */}
        <Link href="/contact">
          <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 duration-200">
            <Phone size={20} />
            <span>Liên hệ hỗ trợ</span>
          </button>
        </Link>

        {/* Nút Mua Lại - Phải */}
        {isCompleted && (
          <button
            onClick={() => handleReorder(order)}
            disabled={isReordering}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isReordering ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Đang xử lý</span>
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>Mua lại</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
            )}
          </div>
            {/* Right Column */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-lg">Thông tin khách hàng</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Người nhận</div>
                      <div className="font-semibold text-gray-900">{order.customerInfo.fullName}</div>
                    </div>
                  </div>
                
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Số điện thoại</div>
                      <div className="font-semibold text-gray-900">{order.customerInfo.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email</div>
                      <div className="font-semibold text-gray-900 break-all">{order.customerInfo.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Địa chỉ giao hàng</div>
                      <div className="font-medium text-gray-900">{order.customerInfo.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-lg">Thông tin thanh toán</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Phương thức thanh toán</div>
                      <div className="font-semibold text-gray-900">{getPaymentMethodLabel(order.paymentMethod)}</div>
                    </div>
                  </div>

                  {/* ✅ CẬP NHẬT: HỖ TRỢ PAYMENT STATUS */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOrderPaid ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {isOrderPaid ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Trạng thái thanh toán</div>
                      <div className={`font-semibold ${order.status === 'cancelled' && isOrderPaid
                          ? 'text-orange-600'
                          : order.status === 'cancelled' && !isOrderPaid
                            ? 'text-red-600'
                            : isOrderPaid
                              ? 'text-green-600'
                              : 'text-red-600'
                        }`}>
                        {
                          order.status === 'cancelled' && isOrderPaid
                            ? 'Đã hoàn tiền'
                            : order.status === 'cancelled' && !isOrderPaid
                              ? 'Đơn đã hủy'
                              : isOrderPaid
                                ? 'Đã thanh toán'
                                : 'Chưa thanh toán'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Ngày đặt hàng</div>
                      <div className="font-semibold text-gray-900">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {/* <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold mb-4">Cần hỗ trợ?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nếu bạn có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với chúng tôi.
              </p>
              <Link href="/contact">
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
                  Liên hệ hỗ trợ
                </button>
              </Link>
            </div> */}
            </div>
          
        </div>
      </div>
    </div>)
}