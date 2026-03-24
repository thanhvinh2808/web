// app/layout.tsx
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "../app/contexts/SocketContext";
import { OrderProvider } from "../app/contexts/OrderContext";
import ConditionalLayout from "./admin/components/ConditionalLayout";
import ClientProviders from "../components/ClientProviders";
import { Toaster } from "react-hot-toast";
import Providers from "../components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"], // Thêm vietnamese để hỗ trợ dấu tiếng Việt
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="vi" className={inter.variable}>
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
                    <Toaster position="top-right" />
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
