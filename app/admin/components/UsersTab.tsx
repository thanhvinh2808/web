// app/admin/components/UsersTab.tsx
'use client';
import React, { useState } from 'react';
import { API_URL } from '../config/constants';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTabProps {
  users: User[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function UsersTab({ users, token, onRefresh, showMessage }: UsersTabProps) {
  const [resetPasswordModal, setResetPasswordModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Cập nhật role thành công!');
        onRefresh();
      }
    } catch (error) {
      showMessage('Lỗi khi cập nhật role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Xóa user thành công!');
        onRefresh();
      }
    } catch (error) {
      showMessage('Lỗi khi xóa user');
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showMessage('Password phải có ít nhất 6 ký tự!');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/users/${resetPasswordModal}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Password đã reset thành: ${newPassword}`);
        setResetPasswordModal(null);
        setNewPassword('');
      } else {
        showMessage(data.message || 'Lỗi reset password');
      }
    } catch (error) {
      showMessage('Lỗi kết nối server');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 Quản lý Users</h2>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setResetPasswordModal(user._id)}
                      className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                    >
                      🔑 Reset
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className={`px-3 py-1 rounded-lg border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50'}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">🔑 Reset Password</h3>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập password mới..."
              className="w-full px-4 py-3 border rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button onClick={resetPassword} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Xác nhận</button>
              <button onClick={() => { setResetPasswordModal(null); setNewPassword(''); }} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}