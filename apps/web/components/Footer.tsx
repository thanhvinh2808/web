"use client";
import Link from "next/link";
import { MapPin, Truck, ShieldCheck, Mail, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-stone-950 text-stone-400 pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Social */}
          <div>
              <Link href="/" className="flex flex-col mb-6 group">
                <h2 className="text-3xl font-black italic text-white group-hover:opacity-80 transition">
                  FOOT<span className="text-primary">MARK</span>.
                </h2>
                <span className="text-[10px] font-bold tracking-[0.2em] text-stone-600 uppercase">Authentic Sneakers</span>
              </Link>
              
              <p className="mb-6 text-sm leading-relaxed">
                Hệ thống bán lẻ giày Sneaker Authentic & 2Hand uy tín hàng đầu. 
                Cam kết chính hãng trọn đời. Fake đền x10 giá trị sản phẩm.
              </p>
              
              <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-900 rounded-none flex items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer border border-stone-800 hover:border-primary">
                    <span className="font-bold">F</span>
                  </div>
                  <div className="w-10 h-10 bg-stone-900 rounded-none flex items-center justify-center hover:bg-pink-600 hover:text-white transition cursor-pointer border border-stone-800 hover:border-pink-500">
                    <span className="font-bold">I</span>
                  </div>
                  <div className="w-10 h-10 bg-stone-900 rounded-none flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer border border-stone-800 hover:border-white">
                    <span className="font-bold">T</span>
                  </div>
              </div>
          </div>
          
          {/* Links 1 */}
          <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wider text-sm">Về Chúng Tôi</h4>
              <ul className="space-y-3 text-sm">
                  <li><Link href="/about" className="hover:text-white transition">Giới thiệu FootMark</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition">Tuyển dụng</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition">Chính sách bảo mật</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">Điều khoản dịch vụ</Link></li>
              </ul>
          </div>

          {/* Links 2 */}
          <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wider text-sm">Hỗ Trợ Khách Hàng</h4>
              <ul className="space-y-3 text-sm">
                  <li><Link href="/guide" className="hover:text-white transition">Hướng dẫn mua hàng</Link></li>
                  <li><Link href="/return-policy" className="hover:text-white transition">Chính sách đổi trả</Link></li>
                  <li><Link href="/shipping" className="hover:text-white transition">Vận chuyển & Giao nhận</Link></li>
                  <li><Link href="/check-legit" className="hover:text-white transition flex items-center gap-2"><ShieldCheck size={14}/> Check Legit miễn phí</Link></li>
              </ul>
          </div>

          {/* Contact */}
          <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wider text-sm">Liên Hệ</h4>
              <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                      <MapPin size={20} className="mt-1 flex-shrink-0 text-white"/>
                      <span>123 Đường ABC, Quận 1, TP.HCM <br/> (Mở cửa: 9:00 - 22:00)</span>
                  </li>
                  <li className="flex items-center gap-3">
                      <Phone size={20} className="flex-shrink-0 text-white"/>
                      <a href="tel:0987654321" className="hover:text-white transition">0987.654.321</a>
                  </li>
                  <li className="flex items-center gap-3">
                      <Mail size={20} className="flex-shrink-0 text-white"/>
                      <a href="mailto:support@footmark.vn" className="hover:text-white transition">support@footmark.vn</a>
                  </li>
              </ul>
          </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-stone-900 text-center text-xs text-stone-600">
          <p>© 2026 FootMark Store. All rights reserved.</p>
      </div>
    </footer>
  );
};
