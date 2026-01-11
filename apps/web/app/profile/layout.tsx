"use client";

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileSidebar from './components/ProfileSidebar';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          {/* Sidebar - 25% width on desktop */}
          <aside className="w-full md:w-1/4 hidden md:block">
             <div className="bg-transparent">
                <ProfileSidebar />
             </div>
          </aside>

          {/* Main Content - 75% width */}
          <main className="w-full md:w-3/4 bg-white rounded-sm shadow-sm p-6 min-h-[500px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}