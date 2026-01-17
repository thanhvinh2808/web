// app/admin/components/UsersTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, User, UserCheck, Shield, Lock, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config/constants';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface UsersTabProps {
  users: UserData[]; // Note: Parent passes initial list, but this component will manage its own state for pagination/search
  token: string;
  onRefresh: () => void; // Call parent refresh if needed
  showMessage: (msg: string) => void;
}

export default function UsersTab({ token, showMessage }: UsersTabProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // ✅ State cho input gõ
  const [searchTerm, setSearchTerm] = useState('');   // ✅ State thực tế để gọi API
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // ✅ DEBOUNCE SEARCH: Chỉ search khi người dùng ngừng gõ 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset về trang 1 khi search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users?page=${page}&search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        if (data.pagination) setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error(error);
      showMessage('Lỗi tải danh sách user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [page, searchTerm, token]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Đã cập nhật quyền thành ${newRole}`);
        fetchUsers();
      } else {
        showMessage('Lỗi cập nhật quyền');
      }
    } catch (error) {
      showMessage('Lỗi kết nối');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn user này? Hành động này không thể hoàn tác!')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        showMessage('Đã xóa user');
        fetchUsers();
      } else {
        showMessage('Lỗi xóa user');
      }
    } catch (error) {
      showMessage('Lỗi kết nối');
    }
  };
   // 🔑 Xử lý Reset Password
   const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser._id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('Đã reset mật khẩu thành công!');
        setResetModalOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        showMessage(data.message || 'Lỗi reset mật khẩu');
      }
    } catch (error) {
      showMessage('Lỗi kết nối server');
    }
  };

  const openResetModal = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black italic tracking-tighter text-black uppercase mb-2">👥 Quản Lý Người Dùng</h2>
        <p className="text-gray-500 font-medium text-sm">Quản lý tài khoản và phân quyền hệ thống</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc email người dùng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-bold text-sm transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người Dùng</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai Trò</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày Tham Gia</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">Đang tải dữ liệu...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">Không tìm thấy user nào.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm ${
                         user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{user.name}</div>
                        <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">ID: {user._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-2 font-medium text-gray-600">
                        {user.email}
                     </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="relative inline-block group">
                       <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user._id, e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none outline-none ring-1 ring-inset cursor-pointer ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 ring-purple-200 hover:bg-purple-100' 
                            : 'bg-green-50 text-green-700 ring-green-200 hover:bg-green-100'
                        }`}
                      >
                        <option value="user">User Member</option>
                        <option value="admin">Admin Access</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-xs text-gray-500">
                       {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button
                           onClick={() => openResetModal(user)}
                           title="Đổi mật khẩu"
                           className="p-2 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition shadow-sm"
                        >
                           <RotateCcw size={16} strokeWidth={2.5} />
                        </button>
                       <button 
                         onClick={() => handleDelete(user._id)}
                         title="Xóa user"
                         className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition shadow-sm"
                       >
                         <Trash2 size={16} strokeWidth={2.5} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              page === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-bold text-xs transition ${
                      page === pageNum
                        ? 'bg-black text-white shadow-lg scale-110'
                        : 'bg-white border border-gray-200 text-black hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === page - 2 || 
                pageNum === page + 2
              ) {
                return <span key={pageNum} className="flex items-end pb-2">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
              page === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

       {/* Modal Reset Password */}
       {resetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase">Đặt Lại Mật Khẩu</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Cấp lại quyền truy cập</p>
              </div>
              <button 
                onClick={() => setResetModalOpen(false)}
                className="text-gray-400 hover:text-black transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-8 space-y-6">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm text-orange-800 font-medium">
                  Đang đặt lại mật khẩu cho tài khoản:
                </p>
                <p className="text-lg font-bold text-black mt-1">{selectedUser?.email}</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                <input 
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setResetModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-stone-800 transition shadow-lg"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}