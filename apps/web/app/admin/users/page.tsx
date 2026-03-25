"use client";

import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, User, UserCheck, Shield, Lock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CLEAN_API_URL } from '@lib/shared/constants';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${CLEAN_API_URL}/api/admin/users?page=${page}&search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${CLEAN_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã cập nhật quyền thành ${newRole}`);
        fetchUsers();
      } else {
        toast.error('Lỗi cập nhật quyền');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn user này? Hành động này không thể hoàn tác!')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${CLEAN_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Đã xóa user');
        fetchUsers();
      } else {
        toast.error('Lỗi xóa user');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };
   // 🔑 Xử lý Reset Password
   const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${CLEAN_API_URL}/api/admin/users/${selectedUser._id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Đã reset mật khẩu thành công!');
        setResetModalOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        toast.error(data.message || 'Lỗi reset mật khẩu');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    }
  };

  const openResetModal = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Người Dùng</h1>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Người Dùng</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Vai Trò</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Ngày Tham Gia</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Không tìm thấy user nào.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className={`border rounded px-2 py-1 text-sm font-medium focus:outline-none cursor-pointer ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                        onClick={() => openResetModal(user)}
                        title="Đổi mật khẩu"
                        className="text-orange-500 hover:bg-orange-50 p-2 rounded mr-2"
                      >
                        <RotateCcw size={18} />
                      </button>
                    <button 
                      onClick={() => handleDelete(user._id)}
                      title="Xóa user"
                      className="text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                page === i + 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
       {/* Modal Reset Password */}
       {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Đặt Lại Mật Khẩu</h2>
              <button 
                onClick={() => setResetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Đang đặt lại mật khẩu cho tài khoản: <strong>{selectedUser?.email}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input 
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
