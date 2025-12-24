import { Blog } from "../blog/types";
import { CartItem } from "../cart/types";
import { PageType } from "../page/types";
import { Product } from "../product/types";

export interface HeaderProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;  // Đơn giản hóa
  cartCount: number;
}

export interface FooterProps {
  setCurrentPage: (page: PageType) => void;  // Đơn giản hóa
}

export interface HomePageProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
}

export interface ProductsPageProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
}

export interface ProductDetailPageProps {
  product: Product | null;
  addToCart: (product: Product) => void;
  setCurrentPage: (page: PageType) => void;
}

export interface CartPageProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  setCurrentPage: (page: PageType) => void;
}

export interface BlogPageProps {
  setCurrentPage: (page: PageType) => void;
  setSelectedBlog: (blog: Blog) => void;
}

export interface BlogDetailPageProps {
  blog: Blog | null;
  setCurrentPage: (page: PageType) => void;
}

export interface LoginPageProps {
  setCurrentPage: (page: PageType) => void;
}

export interface RegisterPageProps {
  setCurrentPage: (page: PageType) => void;
}