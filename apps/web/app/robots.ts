import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/cart', '/checkout', '/profile', '/orders', '/login', '/register', '/reset-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
