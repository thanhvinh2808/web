import { MetadataRoute } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const BASE_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'

interface Product {
  slug: string
  updatedAt: string
}

interface Category {
  slug: string
  updatedAt?: string
}

interface Blog {
  slug: string
  updatedAt: string
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { 
      next: { revalidate: 3600 } // Revalidate every hour
    })
    if (!res.ok) return []
    const result = await res.json()
    return Array.isArray(result) ? result : (result.data || [])
  } catch (error) {
    console.error('Sitemap: Failed to fetch products', error)
    return []
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { 
      next: { revalidate: 3600 } 
    })
    if (!res.ok) return []
    const result = await res.json()
    return Array.isArray(result) ? result : (result.data || [])
  } catch (error) {
    console.error('Sitemap: Failed to fetch categories', error)
    return []
  }
}

async function getBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/blogs`, { 
      next: { revalidate: 3600 } 
    })
    if (!res.ok) return []
    const result = await res.json()
    return Array.isArray(result) ? result : (result.data || [])
  } catch (error) {
    console.error('Sitemap: Failed to fetch blogs', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, blogs] = await Promise.all([
    getProducts(),
    getCategories(),
    getBlogs(),
  ])

  // Static routes
  const staticRoutes = [
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

  // Dynamic routes
  const productRoutes = products.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const categoryRoutes = categories.map((category) => ({
    url: `${BASE_URL}/categories/${category.slug}`,
    lastModified: new Date(category.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const blogRoutes = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes]
}
