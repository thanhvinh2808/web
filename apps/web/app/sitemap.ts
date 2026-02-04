import { MetadataRoute } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/blog',
    '/products',
    '/cart',
    '/login',
    '/register',
    '/trade-in',
    '/faq',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    // Tạm thời chỉ dùng static routes để build nhanh và an toàn
    // Bạn có thể mở lại phần dynamic khi API đã ổn định
    return routes;
  } catch (error) {
    console.error('Sitemap error:', error);
    return routes;
  }
}