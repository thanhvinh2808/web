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
      rawUrl = item.image;
    } else if (typeof item === 'string') {
      rawUrl = item;
    }

    // Handle case where image might be an object { url: '...' }
    if (typeof rawUrl === 'object' && rawUrl !== null) {
      // @ts-ignore
      rawUrl = rawUrl.url || '';
    }

    if (!rawUrl || typeof rawUrl !== 'string') {
      return '/placeholder.jpg';
    }

    // Check for "bad data" (legacy issues)
    if (rawUrl.includes('[object')) {
      return '/placeholder.jpg';
    }

    // Return absolute URLs as is
    if (rawUrl.startsWith('http') || rawUrl.startsWith('https') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }

    // Handle relative URLs (Local Uploads)
    // Ensure it starts with / if not present
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    
    // If it's already a complete path like /uploads/..., prepend domain
    return `${API_URL}${cleanPath}`;

  } catch (error) {
    console.error('Error parsing image URL:', error);
    return '/placeholder.jpg';
  }
};
