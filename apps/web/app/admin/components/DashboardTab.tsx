// app/admin/components/DashboardTab.tsx
import React from 'react';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardTab({ stats }: { stats: any }) {
  // Mock data for chart
  const data = [
    { name: 'T2', total: 4000 },
    { name: 'T3', total: 3000 },
    { name: 'T4', total: 2000 },
    { name: 'T5', total: 2780 },
    { name: 'T6', total: 1890 },
    { name: 'T7', total: 2390 },
    { name: 'CN', total: 3490 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className="text-green-500 font-medium flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
          <TrendingUp size={14} /> {trend}
        </span>
        <span className="text-gray-400 ml-2">so với tháng trước</span>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Doanh Thu" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="+12.5%"
        />
        <StatCard 
          title="Đơn Hàng Mới" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend="+5.2%"
        />
        <StatCard 
          title="Người Dùng Mới" 
          value={stats.newUsersThisMonth} 
          icon={Users} 
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend="+2.4%"
        />
        <StatCard 
          title="Sản Phẩm" 
          value="124" // Placeholder if not in stats
          icon={Package} 
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend="+8.1%"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu Đồ Doanh Thu</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Đơn Hàng Gần Đây</h3>
          <div className="space-y-6">
            {stats.recentOrders?.map((order: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {order.userId?.name?.charAt(0) || 'G'}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{order.userId?.name || 'Khách vãng lai'}</h4>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800">{formatCurrency(order.totalAmount)}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
