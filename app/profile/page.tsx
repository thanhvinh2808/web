// app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOrders } from '@/app/contexts/OrderContext';
import { useCart } from '@/app/contexts/CartContext';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Package, 
  Receipt, 
  XCircle, 
  CheckCircle, 
  Truck,
  ShoppingBag,
  ShoppingCart,
  Clock,
  LogOut,
  Edit,
  Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { orders } = useOrders();
  const { addToCart } = useCart();
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      console.log('👤 Current user ID:', user.id);
      console.log('📦 All orders:', orders);
      
      const filteredOrders = orders.filter(order => {
        return order.userId === user.id || order.userId === user._id;
      });
      
      console.log('✅ Filtered orders for user:', filteredOrders);
      setUserOrders(filteredOrders);
    } else {
      setUserOrders([]);
    }
  }, [user, orders]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // ✅ HÀM MUA LẠI ĐƠN HÀNG
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

      alert(`✅ Đã thêm ${totalProductsAdded}sản phẩm (${order.items.length} loại) vào giỏ hàng!`);
      router.push('/cart');

    } catch (error) {
      console.error('❌ Lỗi khi mua lại đơn hàng:', error);
      alert('❌ Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setReorderingId(null);
    }
  };

  const totalOrders = userOrders.length;
  const completedOrders = userOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const pendingOrders = userOrders.filter(o => 
    o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
  ).length;
  const totalSpent = userOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const getOrderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
            <Receipt size={16} /> Chờ xử lý
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
            <Clock size={16} /> Đang xử lý
          </span>
        );
      case 'shipped':
        return (
          <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-sm">
            <Truck size={16} /> Đang giao
          </span>
        );
      case 'delivered':
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm">
            <Package size={16} /> Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <XCircle size={16} /> Đã huỷ
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full" />
                ) : (
                  <User size={48} />
                )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {user?.name || 'Người dùng'}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-blue-100">
                    <Mail size={16} />
                    <span>{user?.email || 'Chưa có email'}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 mt-1 text-blue-100">
                      <Phone size={16} />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ShoppingBag size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Đang xử lý</p>
                  <p className="text-2xl font-bold text-gray-800">{pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-800">{completedOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Receipt size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Tổng chi tiêu</p>
                  <p className="text-xl font-bold text-gray-800">
                    {totalSpent.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package size={28} className="text-blue-600" />
                Lịch sử đơn hàng
              </h2>
              <Link 
                href="/profile/orders"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Xem tất cả →
              </Link>
            </div>

            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  Chưa có đơn hàng nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Bắt đầu mua sắm để xem đơn hàng của bạn tại đây
                </p>
                <Link 
                  href="/products"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Khám phá sản phẩm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.slice(0, 5).map(order => {
                  const isCompleted = order.status === 'delivered' || order.status === 'completed';
                  const isReordering = reorderingId === (order.id || order._id);

                  return (
                    <div 
                      key={order.id || order._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-blue-700">
                            #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {getOrderStatus(order.status)}
                      </div>

                      <div className="border-t border-gray-100 pt-3 mb-3">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 py-2">
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              className="w-14 h-14 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-1">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} x {item.price.toLocaleString('vi-VN')}₫
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-gray-500 ml-16">
                            + {order.items.length - 2} sản phẩm khác
                          </p>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-3 flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                          <span className="text-gray-600 text-sm">Tổng tiền: </span>
                          <span className="font-bold text-lg text-blue-600">
                            {order.totalAmount.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={`/profile/orders/${order.id || order._id}`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition"
                          >
                            Chi tiết
                          </Link>
                          
                          {/* ✅ NÚT MUA LẠI */}
                          {isCompleted && (
                            <button
                              onClick={() => handleReorder(order)}
                              disabled={isReordering}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isReordering ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Đang xử lý
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={16} />
                                  Mua lại
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {userOrders.length > 5 && (
                  <div className="text-center pt-4">
                    <Link 
                      href="/profile/orders"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Xem thêm {userOrders.length - 5} đơn hàng →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}