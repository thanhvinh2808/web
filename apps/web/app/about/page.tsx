"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

// --- TYPES ---
interface AboutStats {
  customers: string;
  products: string;
  stores: string;
  years: string;
}

interface AboutData {
  title: string;
  description: string;
  stats: AboutStats;
  mission: string;
  vision: string;
}

import { CLEAN_API_URL } from '@lib/shared/constants';
const API_URL = CLEAN_API_URL;

// --- ABOUT PAGE COMPONENT ---
export default function AboutPage() {
  const router = useRouter();
  const [about, setAbout] = useState<AboutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/about`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch about data');
        }
        
        const data = await response.json();
        setAbout(data);
      } catch (err) {
        console.error('Error fetching about data:', err);
        setError('Không thể tải thông tin. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Full Width Background */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            {about?.title || 'Về chúng tôi'}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {about?.description || 'Chúng tôi cam kết mang đến những sản phẩm công nghệ tốt nhất'}
          </p>
        </div>
      </section>

      {/* Stats Section - max-w-7xl */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {about?.stats?.customers || '10K+'}
              </div>
              <p className="text-gray-600">Khách hàng</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {about?.stats?.products || '500+'}
              </div>
              <p className="text-gray-600">Sản phẩm</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-pink-600 mb-2">
                {about?.stats?.stores || '20+'}
              </div>
              <p className="text-gray-600">Cửa hàng</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {about?.stats?.years || '5+'}
              </div>
              <p className="text-gray-600">Năm kinh nghiệm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Full Width Background */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4">Sứ mệnh</h3>
              <p className="text-gray-600 leading-relaxed">
                {about?.mission || 'Mang đến những sản phẩm công nghệ chất lượng cao, phục vụ nhu cầu của khách hàng với giá cả hợp lý và dịch vụ tốt nhất.'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4">Tầm nhìn</h3>
              <p className="text-gray-600 leading-relaxed">
                {about?.vision || 'Trở thành cửa hàng công nghệ hàng đầu, được khách hàng tin tưởng và lựa chọn cho mọi nhu cầu về công nghệ.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section - max-w-7xl */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Giá trị cốt lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition-all">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💎</span>
              </div>
              <h4 className="font-bold text-xl mb-2">Chất lượng</h4>
              <p className="text-gray-600">Cam kết cung cấp sản phẩm chính hãng, chất lượng cao</p>
            </div>
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition-all">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤝</span>
              </div>
              <h4 className="font-bold text-xl mb-2">Uy tín</h4>
              <p className="text-gray-600">Xây dựng lòng tin qua từng giao dịch</p>
            </div>
            <div className="text-center p-6 hover:transform hover:-translate-y-2 transition-all">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">❤️</span>
              </div>
              <h4 className="font-bold text-xl mb-2">Tận tâm</h4>
              <p className="text-gray-600">Luôn đặt khách hàng là trung tâm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section - Full Width Background */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng trải nghiệm?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Khám phá hàng trăm sản phẩm công nghệ chất lượng cao với giá tốt nhất
          </p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            Mua sắm ngay
          </button>
        </div>
      </section>
    </div>
  );
}
