"use client";
import Link from "next/link";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] text-stone-400 pt-12 md:pt-20 pb-10 font-sans border-t border-stone-800">
      <div className="container mx-auto px-4">
        
        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-20">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link href="/" className="flex flex-col mb-6 md:mb-8 group w-fit">
              <h2 className="text-4xl font-black italic text-white group-hover:text-primary transition-colors duration-300">
                FOOT<span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">MARK</span>.
              </h2>
              <div className="h-1 w-0 group-hover:w-full bg-primary transition-all duration-500"></div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-stone-500 uppercase mt-2">Authentic Sneakers Culture</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-8 text-stone-500">
              Không chỉ là một cửa hàng, FootMark là nơi kết nối cộng đồng yêu giày. Chúng tôi cam kết mang đến những giá trị thật và những đôi giày "Clean" nhất cho đôi chân của bạn.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook, color: "hover:text-blue-500" },
                { Icon: Instagram, color: "hover:text-pink-500" },
                { Icon: Twitter, color: "hover:text-sky-400" },
                { Icon: Youtube, color: "hover:text-red-600" }
              ].map(({ Icon, color }, idx) => (
                <a key={idx} href="#" className={`w-10 h-10 rounded-full border border-stone-800 flex items-center justify-center transition-all duration-300 hover:border-primary hover:bg-primary/5 ${color}`}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column: Explore */}
            <div>
              <h4 className="text-white font-bold uppercase mb-6 text-sm tracking-widest border-l-2 border-primary pl-3">Khám phá</h4>
              <ul className="space-y-4 text-[13px]">
                <li><Link href="/products" className="hover:text-primary transition-all flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all"/> Bộ sưu tập mới</Link></li>
                <li><Link href="/products?type=2hand" className="hover:text-primary transition-all flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all"/> Giày 2Hand tuyển chọn</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-all flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all"/> Tạp chí Sneaker</Link></li>
                <li><Link href="/trade-in" className="hover:text-primary transition-all flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all"/> Ký gửi & Thu cũ đổi mới</Link></li>
              </ul>
            </div>

            {/* Column: Information */}
            <div>
              <h4 className="text-white font-bold uppercase mb-6 text-sm tracking-widest border-l-2 border-primary pl-3">Thông tin</h4>
              <ul className="space-y-4 text-[13px]">
                <li><Link href="/about" className="hover:text-primary transition-all">Về FootMark</Link></li>
                <li><Link href="/check-legit" className="hover:text-primary transition-all">Quy trình Check Legit</Link></li>
                <li><Link href="/return-policy" className="hover:text-primary transition-all">Chính sách bảo hành</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-all">Hệ thống cửa hàng</Link></li>
              </ul>
            </div>

            {/* Column: Join Us */}
            <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800">
              <h4 className="text-white font-bold uppercase mb-4 text-sm tracking-widest">Gia nhập cộng đồng</h4>
              <p className="text-xs text-stone-500 mb-4">Nhận thông báo về các đợt Drop giày hiếm và ưu đãi độc quyền.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email của bạn..." 
                  className="w-full bg-[#0a0a0a] border border-stone-800 rounded-lg py-3 px-4 text-xs focus:border-primary outline-none transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-600">
                <CheckCircle2 size={12} className="text-primary"/>
                <span>Cam kết không spam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-10 border-y border-stone-900 mb-10">
          {[
            { label: "100% Authentic", sub: "Check legit trọn đời", icon: <ShieldCheck size={20}/> },
            { label: "Fast Shipping", sub: "Giao hỏa tốc 2h", icon: <ArrowRight size={20}/> },
            { label: "Pro Cleaning", sub: "Vệ sinh giày miễn phí", icon: <CheckCircle2 size={20}/> },
            { label: "Best Price", sub: "Deal hời mỗi ngày", icon: <ArrowRight size={20}/> }
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-3 px-4 group cursor-default">
              <div className="text-primary group-hover:scale-110 transition-transform duration-300">{badge.icon}</div>
              <div>
                <p className="text-white text-[11px] font-black uppercase tracking-wider">{badge.label}</p>
                <p className="text-[10px] text-stone-600">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: Legal & Contact */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 text-[11px] text-stone-600">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1"><MapPin size={12}/> CVPM Quang Trung, Quận 12, TP.HCM</span>
              <span className="flex items-center gap-1"><Phone size={12}/> 1900 1221</span>
              <span className="flex items-center gap-1"><Mail size={12}/> hello@footmark.vn</span>
            </div>
            <p>© 2026 FOOTMARK STORE. DESIGNED BY VINH VO. ALL RIGHTS RESERVED.</p>
          </div>
          
          <div className="flex flex-wrap gap-6 font-bold uppercase tracking-tighter">
            <Link href="/terms" className="hover:text-white transition">Điều khoản</Link>
            <Link href="/privacy" className="hover:text-white transition">Bảo mật</Link>
            <Link href="/shipping" className="hover:text-white transition">Vận chuyển</Link>
            <div className="flex items-center gap-2 ml-4">
               <div className="w-10 h-6 bg-[#1A1F71] rounded flex items-center justify-center text-[7px] font-black text-white italic tracking-tighter shadow-sm">VISA</div>
               <div className="w-10 h-6 bg-[#A50064] rounded flex items-center justify-center text-[7px] font-black text-white tracking-tighter shadow-sm">MOMO</div>
               <div className="w-10 h-6 bg-[#005BAA] rounded flex items-center justify-center text-[7px] font-black text-white tracking-tighter shadow-sm">VNPAY</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
