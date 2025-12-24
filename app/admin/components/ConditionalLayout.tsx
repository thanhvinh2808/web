// app/components/ConditionalLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    // ✅ Trang admin: KHÔNG có Header/Footer
    return <>{children}</>;
  }

  // ✅ Trang thường: CÓ Header/Footer
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}