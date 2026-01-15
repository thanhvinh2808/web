// app/layout.tsx
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "../app/contexts/SocketContext";
import { OrderProvider } from '../app/contexts/OrderContext';
import ConditionalLayout from "./admin/components/ConditionalLayout";
import ClientProviders from "../components/ClientProviders"; // ✅ Import từ components/ (ngoài app)
import { Toaster } from 'react-hot-toast';

import "./globals.css";

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
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">
        <SocketProvider>
          <AuthProvider>
            {/* ✅ ClientProviders nằm BÊN TRONG AuthProvider → có thể dùng useAuth() */}
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
      </body>
    </html>
  );
}