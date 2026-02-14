"use client";
import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, User, Mail, Minus } from "lucide-react";
import { useAuth } from "../app/contexts/AuthContext";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ContactWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  // Auto-fill user info if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn.");
        setFormData((prev) => ({ ...prev, message: "" }));
        setIsOpen(false);
      } else {
        toast.error(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error sending contact:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out pointer-events-auto mb-4 w-[350px] sm:w-[380px] flex flex-col ${
            isMinimized ? "h-16" : "h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="bg-black text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black italic text-sm tracking-tight uppercase">
                  Hỗ Trợ FootMark
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Trực tuyến
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-red-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  Xin chào! Bạn cần hỗ trợ gì về sản phẩm hay đơn hàng không? 
                  Hãy gửi tin nhắn, chúng tôi sẽ phản hồi qua email sớm nhất.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isAuthenticated && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <User size={12} /> Họ và tên
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nhập tên của bạn..."
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <Mail size={12} /> Email nhận phản hồi
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {isAuthenticated && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      Đang nhắn tin dưới tên <span className="text-black">{user?.name}</span>
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    Nội dung yêu cầu
                  </label>
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Bạn cần hỗ trợ gì?..."
                    rows={4}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !formData.message.trim()}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/20 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Gửi yêu cầu <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => {
          if (isOpen && isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto transform hover:scale-110 active:scale-95 group relative ${
          isOpen ? "bg-white text-black" : "bg-black text-white"
        }`}
      >
        {isOpen ? (
          <X size={28} />
        ) : (
          <div className="relative">
            <MessageSquare size={28} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black"></span>
          </div>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-20 bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Hỗ trợ khách hàng
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-8 border-transparent border-l-black"></div>
          </div>
        )}
      </button>
    </div>
  );
}
