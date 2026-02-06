// apps/web/lib/imageHelper.ts

/**
 * Helper to get the correct image URL for a product or variant.
 * Handles:
 * - Absolute URLs (Cloudinary, external links)
 * - Relative URLs (Local uploads) -> Prepends API URL
 * - Invalid/Missing URLs -> Returns placeholder
 * - Data URIs (Base64)
 */
export const getImageUrl = (item: any): string => {
  try {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
    
    // Determine the source of the image (Variant > Product > Fallback)
    // Supports structure: item.image, item.url, item.product.image, item.selectedVariant.image
    
    let rawUrl = '';
    
    if (item?.selectedVariant?.image) {
      rawUrl = item.selectedVariant.image;
    } else if (item?.product?.image) {
      rawUrl = item.product.image;
    } else if (item?.image) {
      // Handle legacy object or field named image
      rawUrl = item.image;
    } else if (item?.url) {
      // ✅ Handle standard image object { url: '...' }
      rawUrl = item.url;
    } else if (typeof item === 'string') {
      rawUrl = item;
    }

    // Handle case where image might be an object { url: '...' }
    if (typeof rawUrl === 'object' && rawUrl !== null) {
      // @ts-ignore
      rawUrl = rawUrl.url || '';
    }

    if (!rawUrl || typeof rawUrl !== 'string') {
      return 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image';
    }

    // Check for "bad data" (legacy issues)
    if (rawUrl.includes('[object')) {
      return 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image';
    }

    // Return absolute URLs as is
    if (rawUrl.startsWith('http') || rawUrl.startsWith('https') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }

    // Handle relative URLs (Local Uploads)
    // 1. Replace backslashes with forward slashes (Windows path fix)
    let cleanPath = rawUrl.replace(/\\/g, '/');
    
    // 2. Ensure it starts with / if not present
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    
    // 3. Remove duplicate /uploads if present (e.g. /uploads/uploads/...)
    // if (cleanPath.startsWith('/uploads') && API_URL.endsWith('/uploads')) { ... } // Logic tùy chọn
    
    // If it's already a complete path like /uploads/..., prepend domain
    return `${API_URL}${cleanPath}`;

  } catch (error) {
    console.error('Error parsing image URL:', error);
    return 'https://placehold.co/600x600/f3f4f6/000000?text=No+Image';
  }
};
