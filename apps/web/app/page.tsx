'use client';

import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import BrandSection from '../components/home/BrandSection';
import NewArrivals from '../components/home/NewArrivals';
import SecondHandZone from '../components/home/SecondHandZone';
import TradeInBanner from '../components/home/TradeInBanner';
import BlogSection from '../components/home/BlogSection';
import FeaturedProduct from '../components/home/FeaturedProduct';
import PromoBanner from '../components/home/PromoBanner';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <HeroCarousel />
      <BrandSection />
      {/* <FeaturedProduct /> */}
      <NewArrivals />
      <PromoBanner />
      <SecondHandZone />
      <TradeInBanner />
      <BlogSection />
    </div>
  );
}