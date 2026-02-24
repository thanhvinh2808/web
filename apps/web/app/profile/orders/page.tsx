"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LayoutList,
  Truck,
  Receipt,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ORDERS_PER_PAGE = 5;

const ORDER_TABS = [
  { id: 'all',        label: 'Tất cả'          },
  { id: 'unpaid',     label: 'Chưa thanh toán' },
  { id: 'pending',    label: 'Chờ xác nhận'    },
  { id: 'processing', label: 'Đang xử lý'      },
  { id: 'shipped',    label: 'Đang giao'       },
  { id: 'delivered',  label: 'Hoàn thành'      },
  { id: 'cancelled',  label: 'Đã hủy'          },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusLabel = (s: string) =>
  ({ pending: 'CHỜ XÁC NHẬN', processing: 'ĐANG XỬ LÝ', shipped: 'ĐANG GIAO', delivered: 'HOÀN THÀNH', cancelled: 'ĐÃ HỦY' }[s] ?? s.toUpperCase());

const getStatusColor = (s: string) =>
  ({
    pending:    'text-yellow-600 bg-yellow-50 border-yellow-200',
    processing: 'text-blue-600 bg-blue-50 border-blue-200',
    shipped:    'text-purple-600 bg-purple-50 border-purple-200',
    delivered:  'text-green-600 bg-green-50 border-green-200',
    cancelled:  'text-red-500 bg-red-50 border-red-200',
  }[s] ?? 'text-gray-600 bg-gray-50 border-gray-200');

const isPaid = (o: any) => o.paymentStatus === 'paid' || o.paymentStatus === 'refunded';

// ─── Cost calculation (đồng bộ với OrderSuccessPage & OrderDetailPage) ────────

function calcSummary(order: any) {
  const items = order.items || [];

  // Tạm tính hàng hóa (chưa gồm VAT, ship, giảm)
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity, 0
  );

  // VAT 10%
  const vatAmount = Math.round(subtotal * 0.1);

  // Phí vận chuyển: ưu tiên field từ backend, fallback tính theo ngưỡng
  const shippingFee: number = (() => {
    if (typeof order.shippingFee === 'number') return order.shippingFee;
    if (subtotal >= 1_000_000) return 0;
    if (subtotal >= 500_000)   return 30_000;
    return 50_000;
  })();

  // Giảm giá
  const discountAmount = Number(order.discountAmount) || 0;

  // Tổng = hàng + VAT + ship - giảm
  const finalTotal = subtotal + vatAmount + shippingFee - discountAmount;

  return { subtotal, vatAmount, shippingFee, discountAmount, finalTotal };
}

// ─── Payment badge ────────────────────────────────────────────────────────────

function PaymentBadge({ order }: { order: any }) {
  if (isPaid(order)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border text-green-600 bg-green-50 border-green-200">
        <CheckCircle2 size={10} /> Đã TT
      </span>
    );
  }
  if (order.status === 'cancelled') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border text-orange-600 bg-orange-50 border-orange-200">
      <AlertCircle size={10} /> Chưa TT
    </span>
  );
}

// ─── Unpaid banner ────────────────────────────────────────────────────────────

function UnpaidBanner({ orders, onFilter }: { orders: any[]; onFilter: () => void }) {
  const unpaid = orders.filter(o => !isPaid(o) && o.status !== 'cancelled');
  if (unpaid.length === 0) return null;
  const total = unpaid.reduce((s, o) => s + calcSummary(o).finalTotal, 0);

  return (
    <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3 border border-orange-200 bg-orange-50">
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle size={14} className="text-orange-500 flex-shrink-0" />
        <p className="text-xs font-bold text-orange-700 truncate">
          <span className="font-black">{unpaid.length}</span> đơn chưa thanh toán —{' '}
          tổng <span className="font-black text-orange-800">{total.toLocaleString('vi-VN')}₫</span>
        </p>
      </div>
      <button
        onClick={onFilter}
        className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest border border-orange-400 text-orange-600 px-3 py-1.5 hover:bg-orange-500 hover:text-white active:scale-95 transition-all duration-150"
      >
        Xem ngay
      </button>
    </div>
  );
}

// ─── Payment filter pills ─────────────────────────────────────────────────────

type PayFilter = 'all' | 'paid' | 'unpaid';

const PAY_FILTERS: { id: PayFilter; label: string; activeClass: string; idleClass: string }[] = [
  { id: 'all',    label: 'Tất cả',          activeClass: 'bg-gray-900 border-gray-900 text-white shadow-sm', idleClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' },
  { id: 'paid',   label: 'Đã thanh toán',   activeClass: 'bg-green-600 border-green-600 text-white shadow-sm', idleClass: 'bg-white border-green-200 text-green-600 hover:bg-green-50' },
  { id: 'unpaid', label: 'Chưa thanh toán', activeClass: 'bg-orange-500 border-orange-500 text-white shadow-sm', idleClass: 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50' },
];

function PaymentFilterBar({ value, onChange, counts }: {
  value: PayFilter; onChange: (v: PayFilter) => void; counts: Record<PayFilter, number>;
}) {
  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thanh toán:</span>
      {PAY_FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-all duration-150 active:scale-95 ${value === f.id ? f.activeClass : f.idleClass}`}
        >
          {f.id === 'paid'   && <CheckCircle2 size={11} />}
          {f.id === 'unpaid' && <AlertCircle  size={11} />}
          {f.id === 'all'    && <LayoutList   size={11} />}
          {f.label}
          <span className={`text-[10px] font-black px-1.5 py-0.5 leading-none ml-0.5 ${
            value === f.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
          } ${f.id === 'paid'   && value !== 'paid'   ? 'bg-green-100 text-green-600'   : ''}
            ${f.id === 'unpaid' && value !== 'unpaid' ? 'bg-orange-100 text-orange-600' : ''}`}>
            {counts[f.id]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, reorderingId, onReorder }: {
  order: any; reorderingId: string | null; onReorder: (o: any) => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isReordering = reorderingId === order._id;
  const canReorder   = order.status === 'delivered' || order.status === 'cancelled';
  const canReview    = ['delivered', 'processing', 'shipped'].includes(order.status);
  const unpaid       = !isPaid(order) && order.status !== 'cancelled';

  const { subtotal, vatAmount, shippingFee, discountAmount, finalTotal } = calcSummary(order);

  return (
    <div className={`bg-white border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-px ${unpaid ? 'border-orange-200' : 'border-gray-100'}`}>

      {/* ── Header ── */}
      <div className={`flex justify-between items-center px-4 py-3 border-b ${unpaid ? 'border-orange-100 bg-orange-50/40' : 'border-gray-100 bg-gray-50/60'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs font-bold text-gray-500 flex-shrink-0">#{order._id.slice(-8).toUpperCase()}</span>
          <span className="text-gray-300 flex-shrink-0">|</span>
          <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PaymentBadge order={order} />
          <span className="text-gray-200">|</span>
          <span className={`text-[10px] font-black px-3 py-1 border uppercase tracking-widest ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="px-4 py-3 space-y-3">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
              <img src={item.productImage || '/placeholder.jpg'} alt={item.productName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-sm text-gray-900 line-clamp-1 uppercase tracking-tight italic">{item.productName}</h4>
                {canReview && (
                  <Link
                    href={`/products/${item.productId}?review=true#review`}
                    className="flex-shrink-0 text-[10px] font-black text-primary border border-primary px-2 py-1 hover:bg-primary hover:text-white active:scale-95 active:brightness-90 transition-all duration-150 uppercase tracking-widest"
                  >
                    Đánh giá
                  </Link>
                )}
              </div>
              {item.variant && (
                <span className="inline-block mt-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 uppercase tracking-wider">
                  Size: {item.variant.name}
                </span>
              )}
              <div className="flex justify-between items-end mt-1.5">
                <span className="text-xs text-gray-400 font-semibold">x{item.quantity}</span>
                <span className="text-sm font-black text-gray-900">{item.price.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Cost breakdown (collapsible) ── */}
      <div className={`border-t ${unpaid ? 'border-orange-100' : 'border-gray-100'}`}>
        {/* Toggle button */}
        <button
          onClick={() => setShowBreakdown(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 group"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Receipt size={11} />
            Chi tiết thanh toán
          </span>
          <span className={`text-[10px] text-gray-400 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {/* Breakdown rows */}
        {showBreakdown && (
          <div className={`px-4 pb-3 space-y-2 border-t ${unpaid ? 'border-orange-100 bg-orange-50/20' : 'border-gray-50 bg-gray-50/40'}`}>
            {/* Tạm tính */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tạm tính</span>
              <span className="text-[11px] font-bold text-gray-700">{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>

            {/* VAT */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thuế VAT</span>
                <span className="text-[9px] font-black bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5">10%</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600">+{vatAmount.toLocaleString('vi-VN')}₫</span>
            </div>

            {/* Ship */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Truck size={10} className={shippingFee === 0 ? 'text-green-500' : 'text-gray-400'} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vận chuyển</span>
                {shippingFee === 0 && (
                  <span className="text-[9px] font-black bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5">Free</span>
                )}
              </div>
              <span className={`text-[11px] font-bold ${shippingFee === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                {shippingFee === 0 ? 'Miễn phí' : `+${shippingFee.toLocaleString('vi-VN')}₫`}
              </span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Giảm giá</span>
                  {order.voucherCode && (
                    <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5">{order.voucherCode}</span>
                  )}
                </div>
                <span className="text-[11px] font-black text-primary">-{discountAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}

            {/* Divider + total */}
            <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tổng thanh toán</p>
                <p className="text-[9px] text-gray-400 font-medium mt-0.5">Đã gồm VAT 10%</p>
              </div>
              <span className="text-base font-black text-primary italic tracking-tight">{finalTotal.toLocaleString('vi-VN')}₫</span>
            </div>

            {/* Quick 3-col bar */}
            <div className="grid grid-cols-3 border border-gray-100 divide-x divide-gray-100 mt-1">
              {[
                { label: 'Hàng',  value: subtotal,    color: 'text-gray-700'  },
                { label: 'VAT',   value: vatAmount,   color: 'text-blue-600'  },
                { label: 'Ship',  value: shippingFee, color: shippingFee === 0 ? 'text-green-600' : 'text-gray-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-2 py-2 text-center bg-gray-50/60">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
                  <p className={`text-[10px] font-black italic ${color}`}>
                    {value === 0 && label === 'Ship' ? 'Free' : `${value.toLocaleString('vi-VN')}₫`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={`px-4 py-3 border-t flex items-center justify-between ${unpaid ? 'border-orange-100 bg-orange-50/20' : 'border-gray-100 bg-gray-50/30'}`}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng thanh toán</p>
          <p className="text-lg font-black text-primary italic tracking-tight">{finalTotal.toLocaleString('vi-VN')}₫</p>
          <p className="text-[9px] text-gray-400 font-medium">Gồm VAT 10% • Ship {shippingFee === 0 ? 'miễn phí' : shippingFee.toLocaleString('vi-VN') + '₫'}</p>
        </div>

        <div className="flex items-center gap-2">
          {unpaid && (
            <Link
              href={`/profile/orders/${order._id}`}
              className="px-4 py-2 bg-orange-500 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 active:scale-95 active:brightness-90 transition-all duration-150 shadow-sm flex items-center gap-1.5"
            >
              <CreditCard size={12} /> Thanh toán
            </Link>
          )}

          <Link
            href={`/profile/orders/${order._id}`}
            className="px-4 py-2 border border-gray-200 bg-white text-xs font-bold uppercase tracking-wider text-gray-600 hover:border-gray-400 hover:text-gray-900 active:scale-95 active:bg-gray-100 transition-all duration-150"
          >
            Chi tiết
          </Link>

          {canReorder && (
            <button
              onClick={() => onReorder(order)}
              disabled={isReordering}
              className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 active:scale-95 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
            >
              {isReordering && <Loader2 size={12} className="animate-spin" />}
              Mua lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, totalItems, perPage, onChange }: {
  currentPage: number; totalPages: number; totalItems: number; perPage: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>();
    [1, 2, 3].forEach(p => p <= totalPages && pages.add(p));
    [totalPages - 1, totalPages].forEach(p => p > 0 && pages.add(p));
    [currentPage - 1, currentPage, currentPage + 1].forEach(p => p > 0 && p <= totalPages && pages.add(p));
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | '...')[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
      result.push(sorted[i]);
    }
    return result;
  };

  const base = 'w-8 h-8 flex items-center justify-center border text-xs font-black transition-all duration-150 select-none';
  const idle = 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary active:scale-90 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100';
  const on   = 'bg-primary border-primary text-white shadow-sm active:scale-90 active:brightness-90';

  return (
    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalItems)} / {totalItems} đơn hàng
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(1)}               disabled={currentPage === 1}          className={`${base} ${idle}`}><ChevronsLeft  size={13}/></button>
        <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}          className={`${base} ${idle}`}><ChevronLeft   size={13}/></button>
        {getPageNumbers().map((page, i) =>
          page === '...'
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-300 select-none">···</span>
            : <button key={page} onClick={() => onChange(page)} className={`${base} ${currentPage === page ? on : idle}`}>{page}</button>
        )}
        <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${base} ${idle}`}><ChevronRight  size={13}/></button>
        <button onClick={() => onChange(totalPages)}       disabled={currentPage === totalPages} className={`${base} ${idle}`}><ChevronsRight size={13}/></button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router        = useRouter();
  const { user }      = useAuth();
  const { addToCart } = useCart();

  const [activeTab,      setActiveTab]      = useState('all');
  const [paymentFilter,  setPaymentFilter]  = useState<PayFilter>('all');
  const [orders,         setOrders]         = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [reorderingId,   setReorderingId]   = useState<string | null>(null);
  const [currentPage,    setCurrentPage]    = useState(1);

  // ── Fetch ──────────────────────────────────────────────
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_URL}/api/user/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.data || []).sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // ── Filter ─────────────────────────────────────────────
  useEffect(() => {
    let result = orders;
    if (activeTab === 'unpaid') {
      result = result.filter(o => !isPaid(o) && o.status !== 'cancelled');
    } else if (activeTab !== 'all') {
      result = result.filter(o => o.status === activeTab);
    }
    if (paymentFilter === 'paid')   result = result.filter(o => isPaid(o));
    if (paymentFilter === 'unpaid') result = result.filter(o => !isPaid(o) && o.status !== 'cancelled');
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(o =>
        o._id?.toLowerCase().includes(t) ||
        o.items.some((item: any) => item.productName.toLowerCase().includes(t))
      );
    }
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, activeTab, paymentFilter, searchTerm]);

  // ── Counts ─────────────────────────────────────────────
  const payCounts: Record<PayFilter, number> = {
    all:    orders.length,
    paid:   orders.filter(o => isPaid(o)).length,
    unpaid: orders.filter(o => !isPaid(o) && o.status !== 'cancelled').length,
  };

  // ── Pagination ─────────────────────────────────────────
  const totalPages      = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  // ── Reorder ────────────────────────────────────────────
  const handleReorder = async (order: any) => {
    try {
      setReorderingId(order._id);
      for (const item of order.items) {
        addToCart({ _id: item.productId, name: item.productName, price: item.price, image: item.productImage, stock: 99 } as any, item.quantity);
      }
      router.push('/cart');
    } catch (err) {
      console.error('Reorder error:', err);
    } finally {
      setReorderingId(null);
    }
  };

  const clearFilters = () => { setActiveTab('all'); setPaymentFilter('all'); setSearchTerm(''); };
  const hasFilter = activeTab !== 'all' || paymentFilter !== 'all' || !!searchTerm;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-medium uppercase tracking-wide mb-6">Lịch Sử Đơn Hàng</h1>

      <UnpaidBanner orders={orders} onFilter={() => setPaymentFilter('unpaid')} />

      <PaymentFilterBar value={paymentFilter} onChange={setPaymentFilter} counts={payCounts} />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 mb-5 scrollbar-hide">
        {ORDER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-xs font-bold whitespace-nowrap uppercase tracking-wider border-b-2 transition-all duration-150 active:scale-95 ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        <input
          type="text"
          placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
        />
      </div>

      {/* Filter info */}
      {hasFilter && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 font-medium">
            Tìm thấy <span className="font-black text-gray-700">{filteredOrders.length}</span> đơn hàng
          </p>
          <button
            onClick={clearFilters}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline active:opacity-60 transition-all"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Order list */}
      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200">
            <ShoppingBag size={44} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide mb-3">
              {paymentFilter === 'unpaid' || activeTab === 'unpaid'
                ? 'Không có đơn nào chưa thanh toán 🎉'
                : 'Chưa có đơn hàng nào'}
            </p>
            {!hasFilter && (
              <Link
                href="/products"
                className="inline-block text-xs font-black text-white bg-primary px-5 py-2.5 uppercase tracking-widest hover:bg-primary/90 active:scale-95 active:brightness-90 transition-all duration-150 shadow-sm"
              >
                Mua sắm ngay
              </Link>
            )}
          </div>
        ) : (
          paginatedOrders.map(order => (
            <OrderCard key={order._id} order={order} reorderingId={reorderingId} onReorder={handleReorder} />
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        perPage={ORDERS_PER_PAGE}
        onChange={setCurrentPage}
      />
    </div>
  );
}