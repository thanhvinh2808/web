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
  XCircle, 
  Clock, 
  Truck, 
  ShoppingCart,
  MapPin, 
  CreditCard,
  Loader2,
  Copy,
  Receipt,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";

import { getImageUrl } from "../../../../lib/imageHelper";
import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────

function calculateOrderSummary(order: Order | null) {
  if (!order) return { subtotal: 0, vatAmount: 0, shippingFee: 0, discountAmount: 0, finalTotal: 0 };
  const subtotal = (order.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
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

function CostRow({ label, value, badge, highlight, isTotal }: { label: React.ReactNode; value: number | string; badge?: React.ReactNode; highlight?: boolean; isTotal?: boolean; }) {
  return (
    <div className={`flex justify-between items-center ${isTotal ? 'mt-4 pt-4 border-t border-dashed border-gray-200' : 'text-xs'}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold uppercase tracking-widest ${isTotal ? 'text-black text-sm' : 'text-gray-400'}`}>{label}</span>
        {badge}
      </div>
      <span className={`font-black ${isTotal ? 'text-xl text-primary italic' : highlight ? 'text-primary' : 'text-black'}`}>
        {typeof value === 'number' ? `${value.toLocaleString('vi-VN')}₫` : value}
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cachedOrder = getOrderById(orderId);
    if (cachedOrder) setOrder(cachedOrder);
    const fetchFreshOrder = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setOrder(data.success && data.order ? data.order : data);
        }
      } catch (err) { console.error(err); }
    };
    fetchFreshOrder();
  }, [orderId, user?._id, getOrderById]);

  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;
    const handleStatusUpdate = (data: any) => {
      if (data.orderId === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status, paymentStatus: data.paymentStatus } : null);
        updateOrderInContext(orderId, { status: data.status, paymentStatus: data.paymentStatus });
      }
    };
    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => { socket.off('orderStatusUpdated', handleStatusUpdate); };
  }, [socket, isConnected, orderId, updateOrderInContext]);

  const handleCopy = () => {
    navigator.clipboard.writeText(order?.orderNumber || orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        updateOrderInContext(orderId, data.order);
        setShowCancelConfirm(false);
      }
    } catch { console.error('Error'); } finally { setIsCancelling(false); }
  };

  const handleReorder = async () => {
    if (!order) return;
    setReorderingId(order._id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${order._id}/reorder`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const { data: items } = await res.json();
        for (const item of items) {
          if (item.isAvailable) addToCart({ _id: item.productId, name: item.name, price: item.basePrice, image: item.image, stock: item.variant?.stock || 99 } as any, item.quantity, item.variant);
        }
        router.push('/cart');
      }
    } catch (err) { console.error(err); } finally { setReorderingId(null); }
  };

  if (!order) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  const steps = ['pending', 'processing', 'shipped', 'delivered', 'completed'];
  const currentIdx = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  const getStatusInfo = (s: string) => ({
    pending: { label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: <Clock size={14}/> },
    processing: { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Package size={14}/> },
    shipped: { label: 'Đang giao hàng', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: <Truck size={14}/> },
    delivered: { label: 'Đã giao hàng', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: <CheckCircle2 size={14}/> },
    completed: { label: 'Hoàn thành', color: 'bg-green-600 text-white border-green-700 shadow-sm shadow-green-200', icon: <ShieldCheck size={14}/> },
    cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle size={14}/> },
    cancellation_requested: { label: 'Chờ duyệt hủy', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <Clock size={14}/> },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-teal-50 text-teal-600 border-teal-200', icon: <ArrowLeft size={14}/> },
  }[s] || { label: s, color: 'bg-gray-50 text-gray-600', icon: null });

  const status = getStatusInfo(order.status);
  const { subtotal, vatAmount, shippingFee, discountAmount, finalTotal } = calculateOrderSummary(order);

  // Mapping payment method name
  const getPaymentName = (method: string) => {
    const m = method?.toLowerCase();
    if (m === 'banking') return 'Banking';
    if (m === 'vnpay')   return 'VNPay';
    return 'COD';
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all text-xs uppercase tracking-widest group">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Quay lại
          </button>
          <div className="text-right">
             <div className="hidden xs:block text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Mã đơn hàng</p>
                <div onClick={handleCopy} className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity justify-end">
                  <span className="text-sm font-mono font-black text-black">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                  <Copy size={12} className={copied ? "text-green-500" : "text-gray-300"} />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl mt-8">
        {!isCancelled && (
          <div className="bg-white p-8 md:p-10 border border-gray-100 shadow-sm mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
            <div className="relative flex justify-between px-2">
              {steps.map((step, idx) => {
                const isStepCompleted = currentIdx >= idx;
                const isCurrent = currentIdx === idx;
                return (
                  <div key={step} className="flex flex-col items-center relative z-10 w-full">
                    <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all duration-500 ${
                      isStepCompleted ? 'border-primary bg-primary shadow-lg shadow-primary/20 rotate-45' : 'border-gray-100 bg-white rotate-45'
                    }`}>
                      <div className={`-rotate-45 transition-transform ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                        {isStepCompleted ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                      </div>
                    </div>
                    <span className={`text-[8px] md:text-[10px] font-black uppercase mt-5 tracking-widest text-center px-1 transition-colors ${
                      isStepCompleted ? 'text-primary' : 'text-gray-300'
                    }`}>
                      {getStatusInfo(step).label}
                    </span>
                  </div>
                );
              })}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-50 -z-0">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {isCancelled && (
           <div className="bg-red-50 border border-red-100 p-6 flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="font-black text-red-800 uppercase tracking-wide">Đơn hàng {order.status === 'refunded' ? 'đã hoàn tiền' : 'đã bị hủy'}</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5 italic">Lý do: {order.cancelReason || 'Người dùng yêu cầu hoặc hết hàng'}</p>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Package size={16} className="text-primary" /> Sản phẩm mua ({order.items.length})
                </h3>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 font-black text-[9px] uppercase tracking-widest border ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-6 flex gap-6 group">
                    <div className="w-24 h-24 bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0 relative">
                      <img src={getImageUrl(item.productImage)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black px-2 py-1">x{item.quantity}</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <Link href={`/products/${(item as any).productSlug || item.productId}`} className="hover:text-primary transition-colors">
                           <h4 className="font-black text-sm text-gray-900 uppercase italic tracking-tight line-clamp-1">{item.productName}</h4>
                        </Link>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{(item as any).productBrand || 'FootMark Select'}</p>
                        {(item as any).variant && (
                          <div className="mt-2">
                             <span className="text-[9px] font-black bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 uppercase tracking-widest">
                               SIZE: {(item as any).variant.name}
                             </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-black tracking-tight">{item.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address ONLY */}
            <div className="bg-white border border-gray-100 p-6 shadow-sm relative">
              <div className="absolute top-0 right-6 w-10 h-1 bg-primary/20" />
              <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Thông tin nhận hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Người nhận</p>
                  <p className="text-sm font-black uppercase italic tracking-tight">{order.customerInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Số điện thoại</p>
                  <p className="text-sm font-bold font-mono">{order.customerInfo.phone}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Địa chỉ cụ thể</p>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed italic line-clamp-2">{order.customerInfo.address}</p>
                </div>
              </div>
              {order.note && (
                <div className="mt-6 pt-6 border-t border-gray-50">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Ghi chú đơn hàng</p>
                  <p className="text-xs text-gray-500 italic font-medium">"{order.note}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 sticky top-24">
            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Receipt size={16} className="text-primary" /> Tổng kết thanh toán
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <CostRow label="Tạm tính" value={subtotal} />
                <CostRow label="VAT (10%)" value={vatAmount} badge={<span className="text-[8px] bg-blue-50 text-blue-500 px-1">Đã tính</span>} />
                <CostRow 
                  label="Vận chuyển" 
                  value={shippingFee === 0 ? 'FREE' : shippingFee} 
                  highlight={shippingFee === 0}
                  badge={shippingFee > 0 ? <span className="text-[10px] font-black text-primary">+</span> : null}
                />
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Giảm giá</span>
                       {(order as any).voucherCode && <span className="text-[8px] font-black bg-red-50 text-red-600 border border-red-100 px-1">{(order as any).voucherCode}</span>}
                    </div>
                    <span className="font-black text-red-500">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t-2 border-black border-double">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Mã đơn hàng:</span>
                    <span className="text-[10px] font-mono font-black text-black bg-gray-100 px-2 py-0.5">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                  </div>

                  <div className="flex justify-between items-end mb-3">
                    <span className="font-black text-xs uppercase tracking-tighter">Tổng thanh toán</span>
                    <span className="font-black text-2xl text-primary italic leading-none tracking-tighter">
                      {finalTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Thanh toán:</span>
                    <span className="text-[10px] font-black uppercase text-primary tracking-tight">
                       {getPaymentName((order as any).paymentMethod)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  {order.status === 'completed' ? (
                     <div className="flex items-center gap-2 justify-center py-3 bg-green-50 border border-green-100 text-green-700">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Hoàn tất giao dịch</span>
                     </div>
                  ) : (order.status === 'pending' || order.status === 'processing') && (
                    <button onClick={() => setShowCancelConfirm(true)} className="w-full border-2 border-red-50 text-red-600 font-black py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all active:scale-95">
                      Hủy đơn hàng
                    </button>
                  )}
                  
                  <button onClick={handleReorder} disabled={!!reorderingId} className="w-full bg-black text-white font-black py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                    {reorderingId ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                    Mua lại đơn cũ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="h-1 bg-red-600 w-full" />
            <div className="p-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Xác nhận hủy đơn?</h3>
              <p className="text-xs text-gray-500 font-medium mb-6 uppercase tracking-wide">Lưu ý: Hành động này không thể hoàn tác.</p>
              <textarea 
                className="w-full border-2 border-gray-100 p-4 text-xs font-bold h-32 resize-none focus:border-red-600 outline-none transition-colors uppercase placeholder:text-gray-300" 
                placeholder="Nhập lý do hủy đơn..." 
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)} 
              />
              <div className="flex gap-4 mt-6">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Quay lại</button>
                <button onClick={handleCancelOrder} disabled={!cancelReason.trim() || isCancelling} className="flex-1 bg-red-600 text-white py-4 font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50">
                  {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
