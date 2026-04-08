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
  Copy,
  Receipt,
  Star,
  MessageSquare
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import ReviewModal from "../../../../components/ReviewModal";
import { getImageUrl } from "../../../../lib/imageHelper";
import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

// ── Tính chi phí đơn hàng ────────────────────────────────────────────────────
function calculateOrderSummary(order: Order | null) {
  if (!order) return { subtotal: 0, vatAmount: 0, shippingFee: 0, discountAmount: 0, finalTotal: 0 };

  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const vatAmount = Math.round(subtotal * 0.1);

  const shippingFee: number = (() => {
    if (typeof (order as any).shippingFee === 'number') return (order as any).shippingFee;
    if (subtotal >= 1_000_000) return 0;
    if (subtotal >= 500_000)   return 30_000;
    return 50_000;
  })();

  const discountAmount = Number((order as any).discountAmount) || 0;
  const finalTotal = subtotal + vatAmount + shippingFee - discountAmount;

  return { subtotal, vatAmount, shippingFee, discountAmount, finalTotal };
}

function CostRow({
  label, value, badge, highlight, prefix = '+', className = ''
}: {
  label: React.ReactNode;
  value: number | string;
  badge?: React.ReactNode;
  highlight?: boolean;
  prefix?: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between items-center text-xs ${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        {badge}
      </div>
      <span className={`font-bold ${highlight ? 'text-primary' : 'text-black'}`}>
        {typeof value === 'number'
          ? `${prefix}${value.toLocaleString('vi-VN')}₫`
          : value}
      </span>
    </div>
  );
}

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const cachedOrder = getOrderById(orderId);
    if (cachedOrder) setOrder(cachedOrder);

    const fetchFreshOrder = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data.success && data.order ? data.order : data);
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
        setOrder(prev =>
          prev ? { ...prev, status: data.status, paymentStatus: data.paymentStatus } : null
        );
        updateOrderInContext(orderId, { status: data.status, paymentStatus: data.paymentStatus });
      }
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => { socket.off('orderStatusUpdated', handleStatusUpdate); };
  }, [socket, isConnected, orderId, updateOrderInContext]);

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancelReason }),
      });
      if (!res.ok) throw new Error('Không thể hủy đơn hàng');
      const data = await res.json();
      setOrder(data.order);
      updateOrderInContext(orderId, data.order);
      setShowCancelConfirm(false);
    } catch {
      console.error('Lỗi khi hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setReorderingId(order._id || '');
    
    try {
      // Sử dụng Promise.all để lấy dữ liệu mới nhất của tất cả sản phẩm trong đơn hàng
      await Promise.all(order.items.map(async (item) => {
        const pId = item.productId;
        if (!pId) return;

        try {
          // ✅ FIX: Sửa URL cho đúng với backend (/api/products/:id)
          const res = await fetch(`${API_URL}/api/products/${pId}`);
          if (!res.ok) throw new Error('Sản phẩm không còn tồn tại');
          
          const freshProduct = await res.json();
          
          // Tìm đúng biến thể đã mua trước đây trong danh sách biến thể hiện tại
          const savedVariantName = (item as any).variant?.name;
          let currentVariant = null;
          
          if (savedVariantName && freshProduct.variants) {
            // Duyệt qua tất cả các nhóm biến thể (vd: Size, Color) để tìm option trùng tên
            for (const v of freshProduct.variants) {
              const opt = v.options?.find((o: any) => o.name === savedVariantName);
              if (opt) {
                currentVariant = opt;
                break;
              }
            }
          }

          // Thêm vào giỏ hàng với dữ liệu chuẩn nhất
          addToCart(
            {
              ...freshProduct,
              _id: freshProduct._id || freshProduct.id
            } as any, 
            item.quantity, 
            currentVariant || undefined, // Dùng biến thể lấy từ DB hiện tại
            (item as any).color
          );
        } catch (err) {
          console.error(`Không thể lấy thông tin sản phẩm ${pId}:`, err);
          // ✅ FALLBACK AN TOÀN: Đảm bảo price là số và slug không bị undefined
          addToCart(
            {
              _id: pId,
              id: pId,
              name: item.productName || 'Sản phẩm đã ẩn',
              brand: (item as any).productBrand || 'N/A',
              price: Number(item.price) || 0,
              image: item.productImage,
              slug: (item as any).productSlug || pId, // Dùng ID làm slug tạm nếu không fetch được
              stock: 99
            } as any,
            Number(item.quantity) || 1,
            (item as any).variant,
            (item as any).color
          );
        }
      }));

      // Sau khi xử lý xong tất cả, chuyển hướng sang giỏ hàng
      setTimeout(() => {
        router.push('/cart');
        setReorderingId(null);
      }, 300);

    } catch (error) {
      console.error('Reorder failed:', error);
      setReorderingId(null);
    }
  };

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  const getStatusColor = (s: string) => ({
    pending:    'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-primary',
    shipped:    'bg-purple-100 text-purple-800',
    delivered:  'bg-green-100 text-green-800',
    cancelled:  'bg-red-100 text-red-800',
  }[s] ?? 'bg-gray-100 text-gray-800');

  const getStatusLabel = (s: string) => ({
    pending: 'Chờ xác nhận', processing: 'Đang xử lý',
    shipped: 'Đang giao', delivered: 'Hoàn thành', cancelled: 'Đã hủy',
  }[s] ?? s);

  const { subtotal, vatAmount, shippingFee, discountAmount, finalTotal } = calculateOrderSummary(order);
  const isPaid = (order as any).paymentStatus === 'paid' || (order as any).isPaid;
  const canReview = order.status === 'delivered';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Status Steps */}
        <div className="relative flex justify-between mt-10 mb-10 px-2">
          {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
            const steps = ['pending', 'processing', 'shipped', 'delivered'];
            const currentIdx = steps.indexOf(order.status);
            const isCompleted = idx <= currentIdx;
            const isCancelled = order.status === 'cancelled';
            return (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div className={`w-6 h-6 flex items-center justify-center border-2 transition-all rotate-45 ${
                  isCancelled ? 'border-gray-200 bg-gray-100' :
                  isCompleted  ? 'border-primary bg-primary' : 'border-gray-200 bg-white'
                }`}>
                  {isCompleted && <div className="w-2 h-2 bg-white" />}
                </div>
                <span className={`text-[8px] font-bold uppercase mt-4 tracking-widest ${
                  isCompleted && !isCancelled ? 'text-primary' : 'text-gray-400'
                }`}>
                  {getStatusLabel(step)}
                </span>
              </div>
            );
          })}
          <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-0">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: order.status === 'cancelled'
                  ? '0%'
                  : `${(['pending','processing','shipped','delivered'].indexOf(order.status) / 3) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-black font-medium transition text-sm uppercase tracking-wide active:scale-95"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã đơn hàng</p>
            <p className="text-xl font-mono font-black text-black">
              #{order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : 'N/A')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Info */}
            <div className="bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1 uppercase tracking-wide">Trạng thái đơn hàng</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Cập nhật: {new Date((order as any).updatedAt || (order as any).createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide text-sm">
                  <Package size={18} /> Sản phẩm ({order.items.length})
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-50 overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={getImageUrl(item.productImage)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${(item as any).productSlug || item.productId}`} className="hover:text-primary transition-colors group flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 line-clamp-1 uppercase tracking-tighter italic text-sm group-hover:underline">
                          {item.productName}
                        </h4>
                      </Link>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">{(item as any).productBrand}</p>
                      
                      {(item as any).variant && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 uppercase tracking-widest">
                          Size: {(item as any).variant.name}
                        </span>
                      )}

                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs text-gray-400 font-semibold">x{item.quantity}</span>
                        <span className="text-sm font-black text-gray-900">{item.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-black text-gray-900 mb-2 uppercase tracking-wide text-sm">Thông tin nhận hàng</h3>
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <p className="font-bold text-sm uppercase tracking-wide">{order.customerInfo.fullName}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{order.customerInfo.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400 flex-shrink-0" size={16} />
                <p className="text-xs font-bold tracking-wider">{order.customerInfo.phone}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (PAYMENT & ACTIONS) */}
          <div className="space-y-6">
            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <Receipt size={16} className="text-gray-400" />
                <h3 className="font-black text-gray-900 uppercase tracking-wide text-sm">Thanh toán</h3>
              </div>
              
              <div className="p-5 space-y-3">
                <CostRow label="Tạm tính" value={subtotal} prefix="" />
                <CostRow
                  label="Thuế VAT"
                  value={vatAmount}
                  badge={
                    <span className="text-[9px] font-black bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 uppercase tracking-wider">
                      10%
                    </span>
                  }
                />
                <CostRow
                  label={<span className="flex items-center gap-1">Vận chuyển</span>}
                  value={shippingFee === 0 ? 'Miễn phí' : shippingFee}
                  badge={shippingFee === 0 ? <span className="text-[9px] font-black bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 uppercase">Free</span> : undefined}
                  highlight={shippingFee === 0}
                />
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary uppercase tracking-widest">Mã giảm giá</span>
                      {(order as any).voucherCode && (
                        <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 uppercase">
                          {(order as any).voucherCode}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-primary">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-100 pt-3 mt-1">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-black text-sm uppercase tracking-tighter">Tổng cộng</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Đã gồm VAT 10%</p>
                    </div>
                    <span className="font-black text-xl text-primary italic tracking-tighter leading-none">{finalTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
              </div>

              <div className={`mx-5 mb-5 px-4 py-2.5 flex items-center justify-between border text-xs font-black uppercase tracking-widest ${isPaid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                <span>{isPaid ? ' Đã thanh toán' : ' Chưa thanh toán'}</span>
                <span className="font-mono text-[10px] opacity-60 uppercase">{(order as any).paymentMethod || 'COD'}</span>
              </div>

              {/* ACTIONS AREA */}
              <div className="px-5 pb-5 space-y-4">
                {order.status === 'pending' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full border-2 border-red-100 text-red-600 font-bold py-3 hover:bg-red-50 active:scale-95 active:bg-red-100 transition-all duration-150 text-xs uppercase tracking-widest"
                  >
                    Hủy đơn hàng
                  </button>
                )}
                
                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <button
                    onClick={handleReorder}
                    disabled={reorderingId === order._id}
                    className="w-full bg-black text-white font-bold py-3 hover:bg-gray-900 active:scale-95 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                  >
                    {reorderingId === order._id ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                    Mua lại đơn hàng
                  </button>
                )}

                {/* NÚT ĐÁNH GIÁ NẰM Ở ĐÂY (PHÍA DƯỚI MUA LẠI) */}
                {canReview && (
                  <div className="pt-4 border-t border-dashed border-gray-100 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Đánh giá sản phẩm đã mua:</p>
                    {order.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedProduct({
                          id: item.productId,
                          name: item.productName,
                          image: item.productImage
                        })}
                        className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-100 hover:border-primary hover:bg-white transition group"
                      >
                        <span className="text-[10px] font-bold uppercase italic line-clamp-1 text-left flex-1">{item.productName}</span>
                        <div className="flex items-center gap-1 text-primary font-black text-[9px] uppercase tracking-tighter">
                          <Star size={10} className="fill-primary" /> Đánh giá
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-8 border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-black mb-4 uppercase tracking-tighter italic">Xác nhận hủy đơn?</h3>
            <p className="text-gray-500 text-xs font-medium mb-6 uppercase tracking-wide">Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
            <textarea
              className="w-full border border-gray-300 p-4 text-sm h-24 resize-none font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 mb-6"
              placeholder="Lý do hủy đơn..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all duration-150">Đóng</button>
              <button onClick={handleCancelOrder} disabled={isCancelling || !cancelReason.trim()} className="flex-1 bg-red-600 text-white py-3 font-bold text-xs uppercase tracking-widest hover:bg-red-700 active:scale-95 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150">{isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Popup */}
      {selectedProduct && (
        <ReviewModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
