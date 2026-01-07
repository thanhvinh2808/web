// app/admin/components/ContactsTab.tsx
'use client';
import React, { useState } from 'react';
import { API_URL } from '../config/constants';

interface Contact {
  _id: string;
  fullname: string;
  email: string;
  message: string;
  status: 'pending' | 'replied' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface ContactsTabProps {
  contacts: Contact[];
  token: string;
  onRefresh: () => void;
  showMessage: (msg: string) => void;
}

export default function ContactsTab({ contacts, token, onRefresh, showMessage }: ContactsTabProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const updateStatus = async (contactId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage(`Cập nhật trạng thái thành công!`);
        onRefresh();
        setSelectedContact(null);
      } else {
        showMessage(data.message || 'Lỗi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Lỗi kết nối server');
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage('Xóa liên hệ thành công!');
        onRefresh();
        setSelectedContact(null);
      } else {
        showMessage(data.message || 'Lỗi xóa liên hệ');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Lỗi kết nối server');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      replied: 'bg-green-100 text-green-800 border-green-300',
      closed: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    const labels = {
      pending: '⏳ Chờ xử lý',
      replied: '✅ Đã phản hồi',
      closed: '🔒 Đã đóng'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesFilter = filter === 'all' || contact.status === filter;
    const matchesSearch = 
      contact.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    replied: contacts.filter(c => c.status === 'replied').length,
    closed: contacts.filter(c => c.status === 'closed').length
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📧 Quản lý Liên hệ</h1>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-600 text-sm">Tổng liên hệ</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-gray-600 text-sm">Chờ xử lý</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-600 text-sm">Đã phản hồi</div>
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <div className="text-gray-600 text-sm">Đã đóng</div>
          <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ xử lý ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'replied' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã phản hồi ({stats.replied})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'closed' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã đóng ({stats.closed})
            </button>
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên, email, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <div>Không có liên hệ nào</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thông tin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{contact.fullname}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md truncate">
                        {contact.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">📧 Chi tiết liên hệ</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Họ tên</label>
                <div className="mt-1 text-gray-900">{selectedContact.fullname}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <div className="mt-1 text-gray-900">{selectedContact.email}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Nội dung</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedContact.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Thời gian gửi</label>
                  <div className="mt-1 text-gray-900">
                    {formatDate(selectedContact.createdAt)}
                  </div>
                </div>
              </div>

              {selectedContact.updatedAt !== selectedContact.createdAt && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Cập nhật lần cuối</label>
                  <div className="mt-1 text-gray-900">
                    {formatDate(selectedContact.updatedAt)}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Cập nhật trạng thái
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'pending')}
                    disabled={selectedContact.status === 'pending'}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ⏳ Chờ xử lý
                  </button>
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'replied')}
                    disabled={selectedContact.status === 'replied'}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ✅ Đã phản hồi
                  </button>
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'closed')}
                    disabled={selectedContact.status === 'closed'}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    🔒 Đóng
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => deleteContact(selectedContact._id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  🗑️ Xóa liên hệ này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}