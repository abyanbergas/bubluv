import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import { getImageUrl } from '../services/api';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative bg-white rounded-3xl border border-[#E5DCEC] p-4 flex flex-col items-center text-center overflow-hidden hover:shadow-xl hover:border-[#7652A8]/40 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-full aspect-square rounded-2xl bg-[#FAF5FF] overflow-hidden mb-3 relative flex items-center justify-center group-hover:scale-104 transition-transform duration-300 p-2">
        {category.image ? (
          <img
            src={getImageUrl(category.image)}
            alt={category.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="font-poppins font-extrabold text-2xl text-[#7652A8]/30">
            {category.name.charAt(0)}
          </span>
        )}
      </div>
      <h3 className="font-poppins font-bold text-sm text-[#35264A] group-hover:text-[#7652A8] transition-colors">
        {category.name}
      </h3>
      {category.products_count !== undefined && (
        <span className="text-[11px] text-[#746A7E] font-medium mt-0.5">
          {category.products_count} Varian Produk
        </span>
      )}
    </Link>
  );
};
