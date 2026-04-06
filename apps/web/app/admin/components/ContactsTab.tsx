// app/admin/components/ContactsTab.tsx
'use client';
import React, { useState } from 'react';
import { API_URL } from '../config/constants';
import { Mail, MessageSquare, CheckCircle, XCircle, Search, RefreshCw, Trash2, Clock, Inbox } from 'lucide-react';

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
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const updateStatus = async (contactId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage(`✅ Cập nhật trạng thái thành công!`);
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

  const handleReply = async (contactId: string) => {
    if (!replyMessage.trim()) {
      showMessage('⚠️ Vui lòng nhập nội dung phản hồi');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/contacts/${contactId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ replyMessage })
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage('✅ Đã gửi phản hồi thành công!');
        setReplyMessage('');
        onRefresh();
        setSelectedContact(null);
      } else {
        showMessage(data.error || 'Lỗi gửi phản hồi');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('Lỗi kết nối server');
    } finally {
      setIsSending(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('⚠️ Bạn có chắc muốn xóa liên hệ này?')) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage('✅ Xóa liên hệ thành công!');
        onRefresh();
        setSelectedContact(null);
      }
    } catch (error) {
      showMessage('Lỗi kết nối server');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      replied: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-600'
    };
    
    const labels = {
      pending: 'Chờ Xử Lý',
      replied: 'Đã Phản Hồi',
      closed: 'Đã Đóng'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

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

  const StatCard = ({ label, value, color, icon: Icon }: any) => (
     <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition">
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
           <p className="text-2xl font-black text-black">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
           <Icon size={20}/>
        </div>
     </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase flex items-center gap-2">
             <Mail /> Quản Lý Liên Hệ
           </h2>
           <p className="text-gray-500 text-sm font-medium">Hộp thư hỗ trợ khách hàng</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-black hover:text-white transition flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
        >
          <RefreshCw size={16}/> Làm mới
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tổng Hộp Thư" value={stats.total} color="bg-blue-600" icon={Inbox}/>
        <StatCard label="Chờ Xử Lý" value={stats.pending} color="bg-yellow-500" icon={Clock}/>
        <StatCard label="Đã Phản Hồi" value={stats.replied} color="bg-green-500" icon={CheckCircle}/>
        <StatCard label="Đã Đóng" value={stats.closed} color="bg-gray-500" icon={XCircle}/>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex gap-4">
        <div className="flex gap-2">
           {['all', 'pending', 'replied', 'closed'].map(status => (
              <button
                 key={status}
                 onClick={() => setFilter(status)}
                 className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    filter === status ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                 }`}
              >
                 {status === 'all' ? 'Tất cả' : status === 'pending' ? 'Chờ xử lý' : status === 'replied' ? 'Đã phản hồi' : 'Đã đóng'}
              </button>
           ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-medium transition-all"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="mx-auto text-gray-300 mb-4" size={48}/>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Không có dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-gray-500">Khách Hàng</th>
                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-gray-500">Nội Dung</th>
                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-gray-500">Trạng Thái</th>
                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-gray-500">Thời Gian</th>
                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest text-gray-500 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{contact.fullname}</div>
                      <div className="text-xs font-medium text-gray-500">{contact.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate font-medium">
                        {contact.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(contact.status)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="bg-gray-100 text-gray-600 hover:bg-black hover:text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black italic tracking-tighter text-black uppercase">Chi Tiết Liên Hệ</h2>
              <button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-black transition">✕</button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-lg">
                    {selectedContact.fullname.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-black">{selectedContact.fullname}</h3>
                    <p className="text-sm font-medium text-blue-600">{selectedContact.email}</p>
                    <div className="mt-2">{getStatusBadge(selectedContact.status)}</div>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nội dung tin nhắn</label>
                <div className="p-5 bg-white border-2 border-gray-100 rounded-2xl text-gray-700 text-sm leading-relaxed">
                  {selectedContact.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 bg-gray-50 p-4 rounded-xl">
                 <div>
                    <span className="block font-bold uppercase tracking-widest text-gray-400 text-[10px] mb-1">Gửi lúc</span>
                    {formatDate(selectedContact.createdAt)}
                 </div>
                 <div>
                    <span className="block font-bold uppercase tracking-widest text-gray-400 text-[10px] mb-1">Cập nhật</span>
                    {formatDate(selectedContact.updatedAt)}
                 </div>
              </div>

              {/* Reply Section */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Mail size={14} className="text-blue-600"/> Phản hồi qua Email
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi cho khách hàng..."
                  rows={4}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-none mb-3 font-medium"
                ></textarea>
                <button
                  onClick={() => handleReply(selectedContact._id)}
                  disabled={isSending || !replyMessage.trim()}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Đang gửi phản hồi...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Gửi phản hồi ngay
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Cập nhật trạng thái
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'pending')}
                    disabled={selectedContact.status === 'pending'}
                    className="py-3 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-xs uppercase hover:bg-yellow-100 disabled:opacity-50 transition"
                  >
                    Chờ xử lý
                  </button>
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'replied')}
                    disabled={selectedContact.status === 'replied'}
                    className="py-3 bg-green-50 text-green-700 rounded-xl font-bold text-xs uppercase hover:bg-green-100 disabled:opacity-50 transition"
                  >
                    Đã phản hồi
                  </button>
                  <button
                    onClick={() => updateStatus(selectedContact._id, 'closed')}
                    disabled={selectedContact.status === 'closed'}
                    className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase hover:bg-gray-200 disabled:opacity-50 transition"
                  >
                    Đóng yêu cầu
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={() => deleteContact(selectedContact._id)}
                  className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={16}/> Xóa liên hệ này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}