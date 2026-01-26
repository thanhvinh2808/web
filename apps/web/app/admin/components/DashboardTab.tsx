'use client';
import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, DollarSign, TrendingUp, Package, ArrowUpRight, ArrowDownRight, Clock, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_URL } from '../config/constants';

export default function DashboardTab({ stats }: { stats: any }) {
  const [revenueStats, setRevenueStats] = useState({
    totalAllTime: 0,
    totalInRange: 0,
    chartData: []
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    endDate: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRevenue();
  }, [dateRange]);

  const fetchRevenue = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRevenueStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, isUp, subValue }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700 ${color}`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-blue-100`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
          {isUp ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {trend}
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter text-black">{value}</h3>
        {subValue && <p className="text-xs text-gray-500 font-medium mt-1">{subValue}</p>}
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-black">Tổng Quan Hệ Thống</h2>
            <p className="text-gray-500 font-medium">Chào mừng trở lại, thống kê kinh doanh FootMark của bạn hôm nay.</p>
         </div>
         <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Cập nhật lúc</span>
            <span className="text-sm font-bold text-black flex items-center justify-end gap-2">
               <Clock size={14} className="text-blue-600"/> {new Date().toLocaleTimeString('vi-VN')}
            </span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Box 1: Tổng doanh thu All-time */}
        <StatCard 
          title="Tổng Doanh Thu" 
          value={formatCurrency(revenueStats.totalAllTime)} 
          subValue="Toàn thời gian"
          icon={DollarSign} 
          color="bg-black"
          trend="Lifetime"
          isUp={true}
        />
        
        {/* Box 2: Doanh thu theo lọc */}
        <StatCard 
          title="Doanh Thu (Lọc)" 
          value={formatCurrency(revenueStats.totalInRange)} 
          subValue={`${dateRange.startDate.split('-').reverse().slice(0,2).join('/')} - ${dateRange.endDate.split('-').reverse().slice(0,2).join('/')}`}
          icon={TrendingUp} 
          color="bg-green-600"
          trend="Selected"
          isUp={true}
        />

        <StatCard 
          title="Đơn Hàng Mới" 
          value={stats.totalOrders || 0} 
          icon={ShoppingBag} 
          color="bg-blue-600"
          trend="+5.2%"
          isUp={true}
        />
        <StatCard 
          title="Khách Hàng" 
          value={stats.newUsersThisMonth || 0} 
          icon={Users} 
          color="bg-purple-600"
          trend="+2.4%"
          isUp={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
             <h3 className="text-xl font-black italic uppercase tracking-tighter">Phân Tích Doanh Thu</h3>
             
             {/* Date Filter */}
             <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 px-2">
                   <Calendar size={14} className="text-gray-500"/>
                   <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Lọc:</span>
                </div>
                <input 
                   type="date" 
                   name="startDate"
                   value={dateRange.startDate}
                   onChange={handleDateChange}
                   className="bg-white border border-gray-200 rounded-lg text-xs font-bold px-2 py-1.5 outline-none focus:border-blue-500 transition-colors"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input 
                   type="date" 
                   name="endDate"
                   value={dateRange.endDate}
                   onChange={handleDateChange}
                   className="bg-white border border-gray-200 rounded-lg text-xs font-bold px-2 py-1.5 outline-none focus:border-blue-500 transition-colors"
                />
             </div>
          </div>
          
          <div className="h-[350px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueStats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold'}}
                  tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  cursor={{stroke: '#2563EB', strokeWidth: 2}}
                  contentStyle={{ backgroundColor: '#000', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', color: '#fff' }}
                  itemStyle={{color: '#60A5FA', fontWeight: 'bold'}}
                  labelStyle={{color: '#9CA3AF', marginBottom: '4px', fontWeight: 'bold'}}
                  formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2563EB" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Activity / Orders */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8">Giao Dịch Gần Đây</h3>
          <div className="space-y-6 flex-1">
            {stats.recentOrders?.slice(0, 5).map((order: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black font-black text-sm border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                  {order.userId?.name?.charAt(0) || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{order.userId?.name || 'Guest'}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-black">{formatCurrency(order.totalAmount)}</div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'text-green-600 bg-green-50' :
                    order.status === 'cancelled' ? 'text-red-600 bg-red-50' :
                    'text-blue-600 bg-blue-50'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all">
             Tất cả giao dịch
          </button>
        </div>
      </div>

      {/* Secondary Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-black p-8 rounded-[2.5rem] text-white">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Lượng Đơn Hàng (Theo Ngày)</h3>
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueStats.chartData}>
                     <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                     <XAxis dataKey="name" hide />
                     <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.1)'}}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', color: '#000' }}
                     />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-white"/>
               </div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Phát Triển</h3>
            </div>
            <p className="text-blue-100 font-medium mb-6">Theo dõi doanh thu thường xuyên giúp tối ưu hóa chiến lược bán hàng. Dữ liệu trên biểu đồ được cập nhật theo thời gian thực.</p>
            <div className="flex gap-4">
               <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                  <span className="text-[10px] font-bold uppercase block opacity-60">Trung bình ngày</span>
                  <span className="font-black italic">
                    {revenueStats.chartData.length > 0 
                      ? formatCurrency(revenueStats.totalInRange / revenueStats.chartData.length) 
                      : '0₫'}
                  </span>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}