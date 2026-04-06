// Nguồn tin cậy duy nhất cho URL API và Socket
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Đảm bảo không có dấu gạch chéo ở cuối
export const CLEAN_API_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

export const SOCKET_URL = CLEAN_API_URL;

// Helper để lấy URL ảnh
export const getFullImageUrl = (path: string) => {
  if (!path) return '/placeholder-product.jpg';
  if (path.startsWith('http')) return path;
  return `${CLEAN_API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};