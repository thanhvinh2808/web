// app/admin/components/DashboardTab.tsx
'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardTabProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    newUsersThisMonth: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardTab({ stats }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="text-5xl opacity-80">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Đơn hàng</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalOrders}</h3>
            </div>
            <div className="text-5xl opacity-80">📦</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Doanh thu</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalRevenue.toLocaleString()}đ</h3>
            </div>
            <div className="text-5xl opacity-80">💰</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">User mới</p>
              <h3 className="text-3xl font-bold mt-2">{stats.newUsersThisMonth}</h3>
            </div>
            <div className="text-5xl opacity-80">✨</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">📈 Thống kê theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { month: 'T1', users: 45, orders: 30 },
              { month: 'T2', users: 52, orders: 40 },
              { month: 'T3', users: 61, orders: 50 },
              { month: 'T4', users: 70, orders: 55 },
              { month: 'T5', users: 85, orders: 70 },
              { month: 'T6', users: stats.totalUsers, orders: stats.totalOrders }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">🥧 Phân bổ dữ liệu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Users', value: stats.totalUsers },
                  { name: 'Orders', value: stats.totalOrders },
                  { name: 'New Users', value: stats.newUsersThisMonth },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                dataKey="value"
              >
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}