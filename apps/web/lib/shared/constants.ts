// Single source of truth from .env NEXT_PUBLIC_API_URL (fallback port 5001 = API default)
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
export const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');
export const CLEAN_API_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

export const SOCKET_URL = CLEAN_API_URL;

// Helper để lấy URL ảnh
export const getFullImageUrl = (path: string) => {
  if (!path) return '/placeholder-product.jpg';
  if (path.startsWith('http')) return path;
  return `${CLEAN_API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};