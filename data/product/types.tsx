export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  description: string;
  category?: string;
}