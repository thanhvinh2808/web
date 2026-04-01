// app/layout.tsx
import { Inter } from "next/font/google";
// Import localFont nếu bạn muốn dùng font từ file tải về
// import localFont from "next/font/local"; 
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "../app/contexts/SocketContext";
import { OrderProvider } from "../app/contexts/OrderContext";
import ConditionalLayout from "./admin/components/ConditionalLayout";
import ClientProviders from "../components/ClientProviders";
import Providers from "../components/providers";
import "./globals.css";

/**
 * [Tối ưu hóa Font cho Mạng Lag / Offline]
 * 
 * Next.js 'next/font/google' tự động download (tải về) và tự lưu trữ (self-hosting) 
 * font chữ tại thời điểm BUILD. Khi chạy thực tế, trình duyệt sẽ KHÔNG gọi sang 
 * máy chủ Google nữa, mà tải trực tiếp từ máy chủ của bạn.
 */
const inter = Inter({
  subsets: ["latin", "vietnamese"], // Hỗ trợ đầy đủ tiếng Việt
  variable: "--font-inter",
  display: "swap", // Giảm thiểu layout shift khi mạng chậm
  preload: true,   // Ưu tiên tải font ngay khi web bắt đầu load
});

/**
 * Ví dụ cách dùng font tải về thủ công (local font):
 * Nếu bạn có file font trong public/fonts/, hãy bỏ comment đoạn dưới:
 */
/*
const brandFont = localFont({
  src: "../public/fonts/FootMark-Bold.woff2",
  variable: "--font-brand",
  display: "swap",
});
*/

export const metadata = {
  title: "FootMark - Authentic Sneakers & Streetwear",
  description: "Hệ thống bán lẻ giày chính hãng và 2hand uy tín hàng đầu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable}`}>
      <body
        className={`${inter.className} min-h-screen bg-gray-50 antialiased`}
      >
        <Providers>
          <SocketProvider>
            <AuthProvider>
              <ClientProviders>
                <OrderProvider>
                  <ConditionalLayout>
                    <main>{children}</main>
                  </ConditionalLayout>
                </OrderProvider>
              </ClientProviders>
            </AuthProvider>
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
