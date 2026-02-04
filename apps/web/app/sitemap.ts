import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://footmark.vercel.app/', lastModified: new Date() },
    { url: 'https://footmark.vercel.app/products', lastModified: new Date() },
    { url: 'https://footmark.vercel.app/blog', lastModified: new Date() },
  ]
}
