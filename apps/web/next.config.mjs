/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'images.unsplash.com', 'footmark-api.onrender.com'], // ✅ Thêm domain Render
    remotePatterns: [
      {
        protocol: 'https', // ✅ HTTPS cho Render
        hostname: 'footmark-api.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`, // ✅ Dùng biến môi trường
      },
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`, // ✅ Proxy API luôn cho chắc
      },
    ];
  },
}
export default nextConfig
