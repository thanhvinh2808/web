import { Star, ShoppingCart } from "lucide-react";

// --- TYPES ---
type PageType = 
  | 'home' 
  | 'products' 
  | 'product-detail' 
  | 'cart' 
  | 'about' 
  | 'contact' 
  | 'blog' 
  | 'blog-detail' 
  | 'faq' 
  | 'login' 
  | 'register';

interface Product {
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

interface ProductCardProps {
  product: Product;
  setCurrentPage: (page: PageType) => void;
  setSelectedProduct: (product: Product) => void;
  addToCart: (product: Product) => void;
}

// --- PRODUCT CARD COMPONENT ---
export const ProductCard = ({ product, setCurrentPage, setSelectedProduct, addToCart }: ProductCardProps) => {
  const handleViewDetail = () => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
  };

  const discount = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
            -{discount}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-12">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          ))}
          <span className="text-xs text-gray-500 ml-2">({product.rating})</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">
              {product.price.toLocaleString('vi-VN')}đ
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {product.originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetail}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Xem chi tiết
          </button>
          <button
            onClick={() => addToCart(product)}
            className="bg-gray-100 text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};