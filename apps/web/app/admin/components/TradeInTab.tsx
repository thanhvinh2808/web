'use client';

import React, { useEffect, useState } from 'react';
import {
    RefreshCw, Eye, CheckCircle, XCircle,
    Loader2, Send, DollarSign, MessageSquare, Search
} from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

const API_URL = CLEAN_API_URL;

interface TradeInTabProps {
    token: string;
    showMessage: (msg: string) => void;
}

// Helper: Format tiền tệ
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function TradeInTab({ token, showMessage }: TradeInTabProps) {
    const [requests, setRequests] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    
    // Filter states
    const [brandFilter, setBrandFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form Reply State
    const [replyForm, setReplyForm] = useState({
        status: 'evaluating',
        finalPrice: 0,
        adminNote: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [tradeRes, catRes] = await Promise.all([
                fetch(`${API_URL}/api/trade-in`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/categories`)
            ]);
            
            const tradeData = await tradeRes.json();
            const catData = await catRes.json();
            
            if (tradeData.success) setRequests(tradeData.data);
            if (Array.isArray(catData)) setBrands(catData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    // Lọc danh sách yêu cầu
    const filteredRequests = requests.filter(req => {
        const matchesBrand = brandFilter === '' || req.brand?.toLowerCase() === brandFilter.toLowerCase();
        const matchesSearch = searchQuery === '' || 
            req.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesBrand && matchesSearch;
    });

    // Handle Open Modal
    const openModal = (req: any) => {
        setSelectedRequest(req);
        setReplyForm({
            status: req.status,
            finalPrice: req.finalPrice || 0,
            adminNote: req.adminNote || ''
        });
        setModalOpen(true);
    };

    // Handle Submit Reply
    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        setSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/api/trade-in/${selectedRequest._id}/reply`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(replyForm)
            });
            const data = await res.json();
            
            if (data.success) {
                setModalOpen(false);
                fetchData(); // ✅ Đã sửa: Gọi đúng hàm fetchData để refresh danh sách
                showMessage('✅ Đã cập nhật trạng thái định giá thành công');
            } else {
                console.error(data.message || 'Lỗi cập nhật');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            pending: 'bg-gray-100 text-gray-800',
            evaluating: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800'
        };
        const labels: any = {
            pending: 'Chờ xử lý',
            evaluating: 'Đang định giá',
            approved: 'Đã chấp nhận',
            rejected: 'Từ chối',
            completed: 'Hoàn tất'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tight">Danh sách yêu cầu</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Tổng cộng: {requests.length} yêu cầu</p>
                    </div>
                    <button onClick={fetchData} className="p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Tìm tên khách, sản phẩm..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black transition"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-black transition"
                            value={brandFilter}
                            onChange={e => setBrandFilter(e.target.value)}
                        >
                            <option value="">Tất cả thương hiệu</option>
                            {brands && Array.isArray(brands) && brands.map(b => (
                                <option key={b._id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="p-5 border-b">Ngày gửi</th>
                                <th className="p-5 border-b">Khách hàng</th>
                                <th className="p-5 border-b">Sản phẩm</th>
                                <th className="p-5 border-b">Định giá</th>
                                <th className="p-5 border-b text-center">Trạng thái</th>
                                <th className="p-5 border-b text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-gray-400">
                                        <Loader2 className="animate-spin inline mr-2" size={32} />
                                        <div className="mt-4 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-gray-400">
                                        <div className="text-[10px] font-black uppercase tracking-widest">Không tìm thấy yêu cầu nào phù hợp</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req._id} className="hover:bg-gray-50 transition group">
                                        <td className="p-5 text-gray-400 text-xs">
                                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-900">{req.userId?.name || 'Vãng lai'}</div>
                                            <div className="text-xs text-gray-500 font-semibold">{req.contactInfo?.phone}</div>
                                            <div className="text-[10px] text-blue-500 font-bold">{req.userId?.email}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-800 uppercase tracking-tight italic">{req.productName}</div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] text-gray-400 font-black uppercase bg-gray-100 px-2 py-0.5 rounded-md">{req.brand}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 font-black text-blue-600 italic">
                                            {req.finalPrice > 0 ? formatCurrency(req.finalPrice) : '-'}
                                        </td>
                                        <td className="p-5 text-center">{getStatusBadge(req.status)}</td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => openModal(req)}
                                                className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center justify-center ml-auto"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {modalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                        
                        {/* Info Column - Left */}
                        <div className="p-6 bg-gray-50 md:w-5/12 border-r border-gray-100 overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 pb-2">Thông tin sản phẩm</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="font-black text-lg italic tracking-tight leading-tight uppercase">{selectedRequest.productName}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{selectedRequest.brand}</span>
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded uppercase">{selectedRequest.category || 'N/A'}</span>
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded uppercase">{selectedRequest.condition}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Khách hàng</label>
                                    <div className="font-bold text-sm text-gray-900">{selectedRequest.userId?.name || selectedRequest.name}</div>
                                    <div className="text-xs text-gray-500 font-bold">{selectedRequest.contactInfo?.phone || selectedRequest.phone}</div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ghi chú của khách</label>
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 italic text-gray-600 text-xs leading-relaxed">
                                        "{(() => {
                                            const rawNote = selectedRequest.description || selectedRequest.note || '';
                                            // Sử dụng Regex để tìm nội dung sau cụm "Ghi chú:" (không phân biệt hoa thường)
                                            const match = rawNote.match(/Ghi chú:\s*(.*)/i);
                                            return match ? match[1].trim() : (rawNote || 'Không có ghi chú');
                                        })()}"
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100 pb-4">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hình ảnh thực tế</label>
                                    {selectedRequest.images && selectedRequest.images.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedRequest.images.map((img: string, idx: number) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition hover:scale-[1.02]"
                                                    onClick={() => setViewImage(img)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-200/50 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[9px] font-black uppercase">
                                            Không có ảnh
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Column - Right */}
                        <div className="p-6 md:w-7/12 flex flex-col max-h-full bg-white relative overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Định giá & Phản hồi</h3>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitReply} className="space-y-5 flex-1">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Cập nhật trạng thái</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'approved', label: 'Chấp nhận', color: 'bg-green-500' },
                                            { id: 'rejected', label: 'Từ chối', color: 'bg-red-500' }
                                        ].map(st => (
                                            <button
                                                key={st.id}
                                                type="button"
                                                onClick={() => setReplyForm({...replyForm, status: st.id})}
                                                className={`px-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center gap-2 border-2 ${
                                                    replyForm.status === st.id 
                                                    ? (st.id === 'approved' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700')
                                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${st.color}`}></div>
                                                {st.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Giá thu mua đề xuất (VND)</label>
                                    
                                    {/* ✅ Hiển thị giá khách mong muốn */}
                                    {selectedRequest.expectedPrice > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase">Khách mong muốn:</span>
                                            <span className="font-black text-blue-600">{formatCurrency(selectedRequest.expectedPrice)}</span>
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            className="w-full px-5 py-5 pl-12 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition font-black text-2xl italic text-green-600 tracking-tight"
                                            value={replyForm.finalPrice > 0 ? new Intl.NumberFormat('vi-VN').format(replyForm.finalPrice) : ''}
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                setReplyForm({...replyForm, finalPrice: Number(rawValue)});
                                            }}
                                            placeholder="Nhập giá chốt..."
                                        />
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors font-black text-2xl">₫</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nội dung phản hồi (Email cho khách)</label>
                                    <textarea 
                                        className="w-full h-40 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition resize-none font-medium text-xs leading-relaxed"
                                        placeholder="Nhập nội dung phản hồi chi tiết về tình trạng giày và lý do định giá..."
                                        value={replyForm.adminNote}
                                        onChange={e => setReplyForm({...replyForm, adminNote: e.target.value})}
                                        required
                                    ></textarea>
                                </div>

                                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2 mt-auto">
                                    <button 
                                        type="button" 
                                        onClick={() => setModalOpen(false)}
                                        className="px-5 py-3 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Xác nhận & Gửi Email</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX */}
            {viewImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setViewImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition"
                        onClick={() => setViewImage(null)}
                    >
                        <XCircle size={40} />
                    </button>
                    <img 
                        src={viewImage} 
                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
}
