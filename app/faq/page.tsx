"use client";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from 'next/link'; // <-- 1. THAY ĐỔI: Import Link

// --- TYPES ---
interface FAQ {
  id: number;
  question: string;
  answer: string;
}

// --- API URL ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// --- FAQ PAGE COMPONENT ---
export default function FAQPage() {
  // State cho dữ liệu, loading và lỗi
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State để quản lý câu hỏi đang mở
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/faq`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        
        const data = await res.json();
        setFaqs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching FAQs:", err);
        setError("Không thể tải câu hỏi thường gặp. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // Loading skeleton (Không đổi)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Câu hỏi thường gặp</h1>
          <p className="text-gray-600 text-center mb-12">Đang tải câu trả lời...</p>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Nội dung trang (Không đổi)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Câu hỏi thường gặp</h1>
        <p className="text-gray-600 text-center mb-12">Tìm câu trả lời cho các thắc mắc của bạn</p>

        {/* Error Message (Không đổi) */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8 text-center">
                {error}
            </div>
        )}

        {/* FAQ List (Không đổi) */}
        <div className="space-y-4">
          {faqs.length > 0 ? (
             faqs.map((faq, index) => (
                <div key={faq.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
                    aria-expanded={openIndex === index}
                  >
                    <span className="font-semibold text-lg text-gray-800 pr-8">{faq.question}</span>
                    <ChevronDown 
                        className={`flex-shrink-0 text-gray-400 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                        size={20}
                    />
                  </button>
                  
                  {openIndex === index && (
                    <div className="px-6 pb-5 pt-2 border-t border-gray-50 animate-fadeIn">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
 )}
                </div>
              ))
          ) : (
              !error && (
                  <div className="text-center py-8 text-gray-500">
                      Hiện chưa có câu hỏi nào được cập nhật.
                  </div>
              )
          )}
        </div>

        {/* Contact Banner */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-10 text-white text-center shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Vẫn còn thắc mắc?</h3>
          <p className="mb-8 text-blue-100 text-lg">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi câu hỏi của bạn 24/7.</p>
          
          {/* <-- 2. THAY ĐỔI: Dùng Link thay cho <a> --> */}
          <Link 
            href="/contact" // Giả sử bạn có trang liên hệ
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            Liên hệ ngay
          </Link>
        </div>
      </div>
    </div>
  );
};