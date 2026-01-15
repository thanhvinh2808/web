'use client';

import React from 'react';
import HeroSection from '../components/home/HeroSection';
import BrandSection from '../components/home/BrandSection';
import NewArrivals from '../components/home/NewArrivals';
import SecondHandZone from '../components/home/SecondHandZone';
import TradeInBanner from '../components/home/TradeInBanner';
import BlogSection from '../components/home/BlogSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <HeroSection />
      <BrandSection />
      <NewArrivals />
      <SecondHandZone />
      <TradeInBanner />
      <BlogSection />
    </div>
  );
}
