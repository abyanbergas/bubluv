import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatRupiah, getImageUrl } from '../services/api';
import { CartIcon } from './SvgIcons';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const currentPrice = hasDiscount ? product.sale_price! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const inStock = product.stock > 0;

  return (
    <div className="group bg-white rounded-3xl border border-[#E5DCEC] p-3.5 hover:shadow-xl hover:border-[#7652A8]/40 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Badges */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
        {hasDiscount && (
          <span className="bg-[#F5A8D0] text-[#35264A] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
            HEMAT {discountPercent}%
          </span>
        )}
        {product.is_best_seller && (
          <span className="bg-[#7652A8] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
            BEST SELLER
          </span>
        )}
        {product.is_new_arrival && (
          <span className="bg-[#4E9F3D] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
            NEW
          </span>
        )}
      </div>

      {/* Image Container */}
      <Link
        to={`/products/${product.slug}`}
        className="block w-full aspect-square rounded-2xl bg-[#FAF5FF] overflow-hidden mb-3 relative p-4 flex items-center justify-center group-hover:bg-[#E9DDFB]/30 transition-colors"
      >
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* Info Container */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category */}
          {product.category && (
            <span className="text-[11px] font-semibold text-[#746A7E] uppercase tracking-wider block mb-1">
              {product.category.name}
            </span>
          )}

          {/* Product Name */}
          <Link
            to={`/products/${product.slug}`}
            className="font-poppins font-bold text-sm text-[#35264A] hover:text-[#7652A8] line-clamp-2 transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Stock */}
        <div className="pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-poppins font-extrabold text-base text-[#7652A8]">
              {formatRupiah(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#746A7E] line-through">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs mt-1 text-[#746A7E]">
            <span>Netto {product.weight}g</span>
            {inStock ? (
              <span className="text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                Tersedia ({product.stock})
              </span>
            ) : (
              <span className="text-rose-500 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full">
                Habis
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex gap-2">
          <Link
            to={`/products/${product.slug}`}
            className="flex-1 text-center py-2 text-xs font-bold text-[#7652A8] bg-[#E9DDFB]/50 hover:bg-[#E9DDFB] rounded-xl transition-colors"
          >
            Detail
          </Link>
          <button
            onClick={() => {
              if (inStock) {
                // If product has active variants, open product detail page so variant can be chosen accurately
                if (product.active_variants && product.active_variants.length > 0) {
                  window.location.href = `/products/${product.slug}`;
                } else {
                  addToCart(product, null, 1);
                }
              }
            }}
            disabled={!inStock}
            className="p-2 bg-[#7652A8] hover:bg-[#5D3F87] text-white rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            title={inStock ? 'Tambah ke Keranjang' : 'Stok Habis'}
            aria-label="Tambah ke Keranjang"
          >
            <CartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
