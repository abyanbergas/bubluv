import React from 'react';
import { Link } from 'react-router-dom';
import { CategoryCard } from '../components/CategoryCard';
import { useStore } from '../context/StoreContext';
import { ChevronRightIcon } from '../components/SvgIcons';

export const CategoriesPage: React.FC = () => {
  const { categories } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#E5DCEC]">
          Semua Series
        </span>
        <h1 className="font-poppins font-extrabold text-3xl sm:text-5xl text-[#35264A]">
          Kategori Rasa BubLuv
        </h1>
        <p className="text-base text-[#746A7E] leading-relaxed">
          Jelajahi aneka series bubuk minuman favoritmu. Pilih kategori untuk melihat varian rasa yang tersedia.
        </p>
      </div>

      {/* Category Grid */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-12 text-center text-[#746A7E]">
          Belum ada kategori tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] p-8 sm:p-10 text-center space-y-4">
        <h2 className="font-poppins font-bold text-xl sm:text-2xl text-[#35264A]">
          Bingung pilih rasa? Lihat semua produk kami
        </h2>
        <p className="text-sm text-[#746A7E]">
          Temukan varian lengkap BubLuv dan racik minuman kekinian favoritmu di rumah.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#7652A8] hover:bg-[#5D3F87] rounded-2xl shadow-sm hover:shadow-md transition-all"
        >
          Lihat Semua Produk
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default CategoriesPage;
