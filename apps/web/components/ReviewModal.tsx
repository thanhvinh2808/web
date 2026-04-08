"use client";
import React, { useState } from 'react';
import { X, Star, Upload, Loader2, CheckCircle } from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image: string;
  };
  onSuccess?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${CLEAN_API_URL}/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, isAnonymous })
      });
// ... (rest of handleSubmit)

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setComment('');
          setRating(5);
        }, 2000);
      } else {
        // Xử lý lỗi từ Server (ví dụ: đã đánh giá rồi)
        setError(data.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md relative shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-black italic uppercase tracking-tighter text-lg">Đánh giá sản phẩm</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="py-10 text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-green-50 flex items-center justify-center mx-auto mb-4 border-2 border-green-100 rounded-full">
                <CheckCircle className="text-green-600 w-10 h-10" />
              </div>
              <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-green-700">Cảm ơn bạn!</h4>
              <p className="text-gray-500 text-sm font-medium italic">Đánh giá của bạn đã được gửi thành công.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4 p-3 bg-gray-50 border border-gray-100">
                <div className="w-16 h-16 bg-white overflow-hidden border border-gray-200 flex-shrink-0">
                  <img 
                    src={product.image.startsWith('http') ? product.image : `${CLEAN_API_URL}${product.image}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1">  
                  <h4 className="font-bold text-sm line-clamp-2 uppercase italic tracking-tighter leading-tight">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sản phẩm đã mua</p>
                </div>
              </div>

              {/* Rating */}
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400 italic">Chọn mức độ hài lòng</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        size={32}
                        className={`${
                          num <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-bold text-yellow-600 uppercase tracking-widest italic">
                  {rating === 5 ? 'Rất hài lòng' : 
                   rating === 4 ? 'Hài lòng' : 
                   rating === 3 ? 'Bình thường' : 
                   rating === 2 ? 'Không hài lòng' : 'Rất tệ'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 italic">
                  Chia sẻ trải nghiệm của bạn
                </label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-black outline-none transition-all font-medium text-sm min-h-[120px] resize-none"
                  placeholder="Sản phẩm đi rất êm, giao hàng nhanh..."
                />
              </div>

              {error && (
                <p className="text-red-600 text-[10px] font-bold uppercase italic animate-pulse">
                  {error}
                </p>
              )}

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                <div className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${isAnonymous ? 'bg-black border-black' : 'border-gray-200 group-hover:border-black'}`}>
                  {isAnonymous && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors select-none">
                  Đánh giá ẩn danh (Giấu tên thật của bạn)
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đánh giá ngay'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
