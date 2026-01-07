// app/admin/components/ConditionalLayout.tsx
"use client"; // ← Phải có dòng này

import { usePathname } from 'next/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}