"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search,
  FileText,
  Loader2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ORDER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'shipped', label: 'Đang giao' },
  { id: 'delivered', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' }
];

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/api/user/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.data || []).sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  useEffect(() => {
    let result = orders;

    if (activeTab !== 'all') {
      result = result.filter(o => o.status === activeTab);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        (o._id && o._id.toLowerCase().includes(term)) ||
        o.items.some((item: any) => item.productName.toLowerCase().includes(term))
      );
    }

    setFilteredOrders(result);
  }, [orders, activeTab, searchTerm]);

  const handleReorder = async (order: any) => {
    try {
      setReorderingId(order._id);
      
      for (const item of order.items) {
        const product = {
          _id: item.productId,
          name: item.productName,
          price: item.price,
          image: item.productImage,
          stock: 99,
        };
        addToCart(product as any, item.quantity); 
      }

      router.push('/cart');
    } catch (error) {
      console.error('Reorder error:', error);
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'CHỜ XÁC NHẬN';
      case 'processing': return 'ĐANG XỬ LÝ';
      case 'shipped': return 'ĐANG GIAO HÀNG';
      case 'delivered': return 'HOÀN THÀNH';
      case 'cancelled': return 'ĐÃ HỦY';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-primary bg-blue-50';
      case 'shipped': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 mb-6 scrollbar-hide">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-4 border-b-2 transition-colors uppercase tracking-wider ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Tìm kiếm đơn hàng..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
        />
      </div>

      {/* Order List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-none border border-dashed border-gray-200">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">Chưa có đơn hàng nào</p>
            <Link href="/products" className="text-primary font-bold hover:underline mt-2 inline-block text-sm uppercase tracking-wider">Mua sắm ngay</Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden hover:shadow-md transition">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-none uppercase tracking-widest ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Items */}
              <div className="p-4 space-y-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-none overflow-hidden border border-gray-200 flex-shrink-0">
                      <img 
                        src={item.productImage || '/placeholder.jpg'} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 line-clamp-1 uppercase tracking-tighter italic">
                        {item.productName}
                      </h4>
                      {item.variant && (
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-none uppercase tracking-wider">
                              Size: {item.variant.name}
                           </span>
                        </div>
                      )}
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs text-gray-500 font-bold">x{item.quantity}</span>
                        <span className="text-sm font-black text-black italic">{item.price.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thành tiền:</p>
                   <p className="text-xl font-black text-primary italic tracking-tighter">{order.totalAmount.toLocaleString('vi-VN')}₫</p>
                </div>
                
                <div className="flex gap-3">
                  <Link 
                    href={`/profile/orders/${order._id}`}
                    className="px-4 py-2 border border-gray-200 rounded-none text-xs font-bold uppercase hover:bg-gray-50 transition tracking-wider"
                  >
                    Chi tiết
                  </Link>
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order._id}
                      className="px-4 py-2 bg-primary text-white rounded-none text-xs font-bold uppercase hover:bg-primary-dark transition flex items-center gap-2 tracking-wider shadow-sm"
                    >
                      {reorderingId === order._id && <Loader2 size={12} className="animate-spin"/>}
                      Mua lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}