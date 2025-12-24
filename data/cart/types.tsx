import { Product } from "../product/types";

export interface CartItem {
  product: Product;
  quantity: number;
}