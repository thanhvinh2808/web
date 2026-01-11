"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext';
import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search,
  ShoppingCart,
  Truck,
  FileText,
  Loader2
} from 'lucide-react';

const ORDER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán' }, // Shopee calls this "Chờ thanh toán" but in our system it maps to pending
  { id: 'processing', label: 'Vận chuyển' },
  { id: 'shipped', label: 'Đang giao' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' }
];

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { addToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState('all');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const myOrders = orders.filter(order => 
        order.userId === user.id || order.userId === user._id
      );
      // Sort newest first
      myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserOrders(myOrders);
    }
  }, [user, orders]);

  useEffect(() => {
    let result = userOrders;

    // Filter by Tab
    if (activeTab !== 'all') {
      if (activeTab === 'completed') {
        result = result.filter(o => o.status === 'completed' || o.status === 'delivered');
      } else {
        result = result.filter(o => o.status === activeTab);
      }
    }

    // Filter by Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.orderNumber?.toLowerCase().includes(term) ||
        o.items.some((item: any) => item.productName.toLowerCase().includes(term))
      );
    }

    setFilteredOrders(result);
  }, [userOrders, activeTab, searchTerm]);

  const handleReorder = async (order: any) => {
    try {
      setReorderingId(order.id || order._id);
      let totalProductsAdded = 0;

      for (const item of order.items) {
        const product = {
          _id: item.productId,
          name: item.productName,
          brand: item.productBrand,
          price: item.price,
          originalPrice: item.price,
          rating: 0,
          image: item.productImage,
          description: '',
          stock: 999,
          slug: item.productSlug || ''
        };
        addToCart(product, item.quantity);
        totalProductsAdded += item.quantity;
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
      case 'pending': return 'CHỜ THANH TOÁN';
      case 'processing': return 'ĐANG XỬ LÝ';
      case 'shipped': return 'ĐANG GIAO';
      case 'delivered': 
      case 'completed': return 'HOÀN THÀNH';
      case 'cancelled': return 'ĐÃ HỦY';
      default: return status.toUpperCase();
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex overflow-x-auto bg-white border-b border-gray-200 mb-4 sticky top-0 z-10">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo Mã đơn hàng hoặc Tên sản phẩm" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isCompleted = order.status === 'delivered' || order.status === 'completed';
            const isReordering = reorderingId === (order.id || order._id);

            return (
              <div key={order.id || order._id} className="bg-white border border-gray-100 rounded-sm shadow-sm p-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">TechStore Official</span>
                    <Link 
                      href={`/profile/orders/${order.id || order._id}`}
                      className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                  <span className="text-blue-600 font-medium text-sm uppercase">
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-20 h-20 border border-gray-200 rounded flex-shrink-0">
                        <img 
                          src={item.productImage} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 line-clamp-2">
                          {item.productName}
                        </h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Phân loại hàng: {item.productBrand || 'Mặc định'}
                        </p>
                        <p className="text-gray-800 mt-1">
                          x{item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 line-through text-sm">
                          {(item.price * 1.2).toLocaleString('vi-VN')}₫
                        </p>
                        <p className="text-blue-600 font-medium">
                          {item.price.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 pt-4 bg-gray-50/50 -mx-6 -mb-6 p-6">
                  <div className="flex justify-end items-center gap-2 mb-4">
                    <span className="text-gray-600">Thành tiền:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {order.totalAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition text-sm">
                      Liên hệ người bán
                    </button>
                    {isCompleted ? (
                       <button
                       onClick={() => handleReorder(order)}
                       disabled={isReordering}
                       className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center gap-2"
                     >
                       {isReordering ? <Loader2 size={14} className="animate-spin" /> : 'Mua lại'}
                     </button>
                    ) : (
                      <button className="px-6 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed text-sm">
                        Đã mua
                      </button>
                    )}
                   
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}