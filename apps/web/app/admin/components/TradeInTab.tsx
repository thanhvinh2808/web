'use client';

import React, { useEffect, useState } from 'react';
import { 
    RefreshCw, Eye, CheckCircle, XCircle, 
    Loader2, Send, DollarSign, MessageSquare, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    
    // Form Reply State
    const [replyForm, setReplyForm] = useState({
        status: 'evaluating',
        finalPrice: 0,
        adminNote: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trade-in`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
            } else {
                toast.error('Không thể tải dữ liệu Trade-in');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchRequests();
    }, [token]);

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trade-in/${selectedRequest._id}/reply`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(replyForm)
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('Đã cập nhật & gửi mail cho khách!');
                setModalOpen(false);
                fetchRequests(); // Reload list
            } else {
                toast.error(data.message || 'Lỗi cập nhật');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi hệ thống');
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
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tight">Danh sách yêu cầu</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Tổng cộng: {requests.length} yêu cầu</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchRequests} className="p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
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
                                <th className="p-5 border-b">Tình trạng</th>
                                <th className="p-5 border-b">Định giá</th>
                                <th className="p-5 border-b">Trạng thái</th>
                                <th className="p-5 border-b text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-gray-400">
                                        <Loader2 className="animate-spin inline mr-2" size={32} />
                                        <div className="mt-4 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center text-gray-400">
                                        <div className="text-[10px] font-black uppercase tracking-widest">Chưa có yêu cầu nào</div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
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
                                            <div className="font-bold text-gray-800">{req.productName}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded-md">{req.brand}</div>
                                        </td>
                                        <td className="p-5 text-gray-600 italic">"{req.condition}"</td>
                                        <td className="p-5 font-black text-blue-600">
                                            {req.finalPrice > 0 ? formatCurrency(req.finalPrice) : '-'}
                                        </td>
                                        <td className="p-5">{getStatusBadge(req.status)}</td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => openModal(req)}
                                                className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center justify-center mx-auto mr-0"
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
                        
                        {/* Info Column */}
                        <div className="p-6 bg-gray-50 md:w-5/12 border-r border-gray-100 overflow-y-auto">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 pb-2">Thông tin sản phẩm</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="font-black text-lg italic tracking-tight leading-tight">{selectedRequest.productName}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{selectedRequest.brand}</span>
                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded uppercase">{selectedRequest.condition}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Khách hàng</label>
                                    <div className="font-bold text-sm text-gray-900">{selectedRequest.userId?.name}</div>
                                    <div className="text-xs text-gray-500">{selectedRequest.contactInfo?.phone}</div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ghi chú của khách</label>
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 italic text-gray-600 text-xs leading-relaxed">
                                        "{selectedRequest.description.split('Ghi chú:')[1]?.trim() || selectedRequest.description}"
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hình ảnh</label>
                                    {selectedRequest.images && selectedRequest.images.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedRequest.images.map((img: string, idx: number) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
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

                        {/* Action Column */}
                        <div className="p-6 md:w-7/12 flex flex-col h-full bg-white relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Định giá & Phản hồi</h3>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitReply} className="space-y-5 flex-1 flex flex-col">
                                <div>
                                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                        {[
                                            { id: 'evaluating', label: 'Đang xem', color: 'bg-yellow-500' },
                                            { id: 'approved', label: 'Chấp nhận', color: 'bg-green-500' },
                                            { id: 'rejected', label: 'Từ chối', color: 'bg-red-500' },
                                            { id: 'completed', label: 'Hoàn tất', color: 'bg-blue-500' }
                                        ].map(st => (
                                            <button
                                                key={st.id}
                                                type="button"
                                                onClick={() => setReplyForm({...replyForm, status: st.id})}
                                                className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center gap-1 border ${
                                                    replyForm.status === st.id 
                                                    ? 'bg-black text-white border-black shadow-md' 
                                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${st.color} ${replyForm.status === st.id ? 'ring-2 ring-white' : ''}`}></div>
                                                {st.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Giá thu mua đề xuất (VND)</label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            className="w-full px-5 py-5 pl-12 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition font-black text-2xl italic text-blue-600 tracking-tight"
                                            value={replyForm.finalPrice > 0 ? new Intl.NumberFormat('vi-VN').format(replyForm.finalPrice) : ''}
                                            onChange={e => {
                                                // Chỉ giữ lại số, loại bỏ mọi ký tự khác
                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                setReplyForm({...replyForm, finalPrice: Number(rawValue)});
                                            }}
                                            placeholder="0"
                                        />
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors font-black text-2xl">₫</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nội dung email</label>
                                    <div className="relative flex-1">
                                        <textarea 
                                            className="w-full h-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition resize-none font-medium text-xs leading-relaxed"
                                            placeholder="Nhập nội dung phản hồi cho khách..."
                                            value={replyForm.adminNote}
                                            onChange={e => setReplyForm({...replyForm, adminNote: e.target.value})}
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
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
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Gửi Phản Hồi</>}
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
