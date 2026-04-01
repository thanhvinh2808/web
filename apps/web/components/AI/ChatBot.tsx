'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { CLEAN_API_URL } from '@lib/shared/constants';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: 'Xin chào! Tôi là trợ lý ảo của FootMark. Tôi có thể giúp gì cho bạn về các mẫu giày sneaker hiện nay không?' }]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 📂 Cấu trúc kịch bản hội thoại (Guided Conversation)
  const menuConfig: Record<string, string[]> = {
    root: [
      "Các mẫu giày mới nhất",
      "Deal hot hôm nay",
      "Tư vấn chọn size",
      "Kiểm tra đơn hàng",
      "Chính sách đổi trả",
      "Địa chỉ cửa hàng"
    ],
    "Các mẫu giày mới nhất": [
      "Dưới 1.000.000đ",
      "1.000.000đ - 2.000.000đ",
      "Trên 2.000.000đ",
      "Quay lại menu chính"
    ],
    "Tư vấn chọn size": [
      "Bảng size Nike",
      "Bảng size Adidas",
      "Cách đo chân tại nhà",
      "Quay lại menu chính"
    ]
  };

  const [currentMenu, setCurrentMenu] = useState<string>("root");
  const [isWaitingForOrderNumber, setIsWaitingForOrderNumber] = useState(false);

  const API_URL = CLEAN_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onQuickReplyClick = (reply: string) => {
    if (reply === "Quay lại menu chính") {
      setCurrentMenu("root");
      setIsWaitingForOrderNumber(false);
      return;
    }

    if (reply === "Kiểm tra đơn hàng") {
      setIsWaitingForOrderNumber(true);
      setMessages(prev => [
        ...prev,
        { role: 'user', parts: [{ text: reply }] },
        { role: 'model', parts: [{ text: "Vui lòng nhập mã đơn hàng của bạn (ví dụ: FM260401-1234 hoặc mã ID):" }] }
      ]);
      return;
    }

    // Nếu câu trả lời này có menu con, chuyển sang menu đó
    if (menuConfig[reply]) {
      setCurrentMenu(reply);
    }

    handleSendMessage(null, reply);
  };

  const handleTrackOrder = async (orderNumber: string) => {
    setIsLoading(true);
    try {
      // ✅ Loại bỏ dấu # nếu người dùng nhập vào
      const cleanOrderNumber = orderNumber.replace('#', '').trim();
      
      const fetchUrl = API_URL.endsWith('/api') 
        ? `${API_URL}/track-order/${cleanOrderNumber}` 
        : `${API_URL}/api/track-order/${cleanOrderNumber}`;
        
      const res = await fetch(fetchUrl);
      const result = await res.json();

      if (res.ok && result.success) {
        const order = result.data;
        const statusMap: Record<string, string> = {
          pending: 'Chờ xác nhận',
          processing: 'Đang xử lý',
          shipped: 'Đang giao hàng',
          delivered: 'Giao hàng thành công',
          cancelled: 'Đã hủy'
        };

        const reply = ` Thông tin đơn hàng #${order.orderNumber}:\n\n` +
          ` Khách hàng: ${order.customerName}\n` +
          ` Ngày đặt: ${new Date(order.date).toLocaleDateString('vi-VN')}\n` +
          ` Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')}₫\n` +
          ` Số lượng: ${order.itemCount} sản phẩm\n` +
          ` Trạng thái: ${statusMap[order.status] || order.status}\n` +
          ` Thanh toán: ${order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`;

        setMessages(prev => [
          ...prev,
          { role: 'user', parts: [{ text: orderNumber }] },
          { role: 'model', parts: [{ text: reply }] }
        ]);
        setIsWaitingForOrderNumber(false);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'user', parts: [{ text: orderNumber }] },
          { role: 'model', parts: [{ text: "❌ Không tìm thấy đơn hàng với mã này. Bạn vui lòng kiểm tra lại mã đơn hàng nhé!" }] }
        ]);
      }
    } catch (error) {
      console.error('Track Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'user', parts: [{ text: orderNumber }] },
        { role: 'model', parts: [{ text: "Hệ thống tra cứu đang gặp sự cố, bạn vui lòng thử lại sau." }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const messageToSend = textOverride || input.trim();
    if (!messageToSend || isLoading) return;

    // Nếu đang trong trạng thái chờ mã đơn hàng
    if (isWaitingForOrderNumber && !textOverride) {
      setInput('');
      await handleTrackOrder(messageToSend);
      return;
    }

    setInput('');
    
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', parts: [{ text: messageToSend }] }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const fetchUrl = API_URL.endsWith('/api') ? `${API_URL}/chat` : `${API_URL}/api/chat`;
      
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: messages 
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessages([
          ...newMessages,
          { role: 'model', parts: [{ text: data.reply }] }
        ]);
      } else {
        throw new Error(data.message || `Lỗi Server (${res.status})`);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: 'Xin lỗi, hệ thống AI đang gặp chút trục trặc. Bạn vui lòng thử lại sau nhé!' }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[10000] group border-4 border-white"
      >
        <Bot size={28} />
        <div className="absolute right-16 bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap border border-white/10">
          Hỏi AI FootMark
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[10000] flex flex-col overflow-hidden border border-gray-100 transition-all duration-500 ease-in-out animate-in slide-in-from-bottom-10 zoom-in-95 ${isMinimized ? 'h-20' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="bg-black p-6 text-white flex justify-between items-center relative overflow-hidden">
        {/* Decor background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
            <Bot size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] leading-none">AI Assistant</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Hệ thống sẵn sàng</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
            {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500 rounded-xl transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                  ? 'bg-black text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            {/* ✅ Quick Replies (Messenger Style) */}
            {!isLoading && messages[messages.length - 1]?.role === 'model' && (
              <div className="flex flex-wrap gap-2 justify-start mt-2 animate-in fade-in slide-in-from-left-4 duration-500">
                {(menuConfig[currentMenu] || menuConfig.root).map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => onQuickReplyClick(reply)}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-black text-[11px] font-bold text-gray-600 hover:text-black rounded-full transition-all active:scale-90 shadow-sm whitespace-nowrap uppercase tracking-widest"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="relative flex items-center gap-3 bg-gray-50 p-2 rounded-[1.25rem] border border-gray-200 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 bg-transparent border-none px-3 py-2 text-sm outline-none font-semibold text-gray-800 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-11 h-11 bg-black text-white rounded-[1rem] flex items-center justify-center hover:bg-gray-800 active:scale-95 disabled:opacity-30 transition-all shadow-lg"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex justify-center items-center gap-2 mt-4 opacity-30 grayscale contrast-200">
               <span className="text-[8px] font-black uppercase tracking-[0.3em]">FootMark AI Intelligence</span>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
