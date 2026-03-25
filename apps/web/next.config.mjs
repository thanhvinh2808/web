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
    domains: ['localhost', 'images.unsplash.com', 'footmark-api.onrender.com'], // ? Th�m domain Render
    remotePatterns: [
      {
        protocol: 'https', // ? HTTPS cho Render
        hostname: 'footmark-api.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    return [
      {
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`,
      },
      // Khng proxy cc route auth c?a NextAuth (ch? proxy cc API khc sang backend)
      {
        source: '/api/((?!auth).*)', 
        destination: `${API_URL}/api/:1`,
      },
    ];
  },
}
export default nextConfig
