"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Plus, Trash2, Building } from 'lucide-react';

export default function BankPage() {
  const { user } = useAuth(); // Assume 'user' updated via context refresh or local storage sync
  const [banks, setBanks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: ''
  });

  // Load banks from user data (You might need a separate API call if context doesn't have it yet)
  useEffect(() => {
    // For now, simulate fetching from user context or localStorage
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (localUser.bankAccounts) {
      setBanks(localUser.bankAccounts);
    }
  }, []);

  const handleDelete = async (bankId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/user/banks/${bankId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.bankAccounts);
        
        // Update Local Storage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.bankAccounts = data.bankAccounts;
        localStorage.setItem('user', JSON.stringify(localUser));
      }
    } catch (error) {
      alert('Lỗi khi xóa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/user/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setBanks(data.bankAccounts);
        setShowForm(false);
        setFormData({ bankName: '', accountNumber: '', accountName: '', branch: '' });

        // Update Local Storage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.bankAccounts = data.bankAccounts;
        localStorage.setItem('user', JSON.stringify(localUser));
      } else {
        alert('Lỗi thêm ngân hàng');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Tài Khoản Ngân Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản ngân hàng để thanh toán và rút tiền</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-sm text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} /> Thêm Tài Khoản
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Thêm Tài Khoản Ngân Hàng</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên Ngân Hàng</label>
                <input 
                  type="text" 
                  required
                  value={formData.bankName}
                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                  className="w-full border p-2 rounded focus:outline-blue-500"
                  placeholder="VD: Vietcombank, Techcombank..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Chi Nhánh</label>
                <input 
                  type="text" 
                  required
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  className="w-full border p-2 rounded focus:outline-blue-500"
                  placeholder="VD: TP.HCM"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Số Tài Khoản</label>
                <input 
                  type="text" 
                  required
                  value={formData.accountNumber}
                  onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full border p-2 rounded focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên Chủ Tài Khoản</label>
                <input 
                  type="text" 
                  required
                  value={formData.accountName}
                  onChange={e => setFormData({...formData, accountName: e.target.value.toUpperCase()})}
                  className="w-full border p-2 rounded focus:outline-blue-500"
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div className="flex gap-2 pt-4 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {banks.length === 0 ? (
        <div className="text-center py-20 bg-white">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building size={40} className="text-gray-400" />
          </div>
          <p className="text-gray-500">Bạn chưa có tài khoản ngân hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banks.map((bank: any) => (
            <div key={bank._id} className="border border-gray-200 p-4 rounded-sm flex items-start justify-between hover:bg-gray-50 transition">
              <div className="flex gap-4">
                <div className="w-16 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center text-blue-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{bank.bankName}</span>
                    {bank.isDefault && (
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Mặc định</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {bank.accountName} - {bank.accountNumber}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{bank.branch}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(bank._id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                title="Xóa"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}