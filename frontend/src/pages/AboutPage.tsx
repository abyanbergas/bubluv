import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, ShieldCheckIcon, TruckIcon, StarIcon, ChevronRightIcon } from '../components/SvgIcons';
import { useStore } from '../context/StoreContext';

export const AboutPage: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#E5DCEC]">
          Cerita Brand Kami
        </span>
        <h1 className="font-poppins font-extrabold text-3xl sm:text-5xl text-[#35264A]">
          Tentang BubLuv
        </h1>
        <p className="text-base text-[#746A7E] leading-relaxed">
          "A little sip, a lot of love." Kami berdedikasi menghadirkan cita rasa bubuk minuman kekinian berkualitas tinggi yang mudah diracik untuk semua orang.
        </p>
      </div>

      {/* Main Story Card */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] p-8 sm:p-12 shadow-sm space-y-6">
        <h2 className="font-poppins font-bold text-2xl text-[#35264A]">
          Komitmen Kualitas & Inovasi Rasa
        </h2>
        <div className="text-sm text-[#746A7E] leading-relaxed space-y-4">
          <p>
            BubLuv berawal dari kecintaan kami terhadap kreasi aneka minuman kafe dan boba kekinian. Banyak pecinta kuliner dan pengusaha UMKM minuman menghadapi kesulitan mencari bubuk minuman yang konsisten, creamy, tidak encer, dan memiliki aroma wangi alami.
          </p>
          <p>
            Melalui riset rasa dan pemilihan bahan baku terbaik, BubLuv meracik formula khusus dengan rasio gula, krimer nabati, dan ekstrak rasa yang seimbang. Setiap seduhan menghasilkan tekstur velvety lembut dengan aftertaste yang memanjakan lidah.
          </p>
          <p>
            Kini, BubLuv dipercaya oleh ratusan gerai kafe, kedai boba, hingga pecinta kreasi minuman di rumah di seluruh Indonesia.
          </p>
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E9DDFB]/60 flex items-center justify-center mx-auto text-[#7652A8]">
            <SparklesIcon className="w-7 h-7" />
          </div>
          <h3 className="font-poppins font-bold text-base text-[#35264A]">Rasa Autentik</h3>
          <p className="text-xs text-[#746A7E]">
            Setiap varian rasa diuji seksama agar menghadirkan cita rasa khas kafe modern.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E9DDFB]/60 flex items-center justify-center mx-auto text-[#7652A8]">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h3 className="font-poppins font-bold text-base text-[#35264A]">Higienis & Aman</h3>
          <p className="text-xs text-[#746A7E]">
            Diproduksi dalam fasilitas higienis dengan bahan baku teruji food grade.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E9DDFB]/60 flex items-center justify-center mx-auto text-[#7652A8]">
            <StarIcon className="w-7 h-7" />
          </div>
          <h3 className="font-poppins font-bold text-base text-[#35264A]">Mitra Bisnis Terpercaya</h3>
          <p className="text-xs text-[#746A7E]">
            Mendukung pengusaha minuman dengan ketersediaan stok stabil dan harga bersaing.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="text-center bg-[#7652A8] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-4">
        <h3 className="font-poppins font-bold text-2xl sm:text-3xl">
          Siap Meracik Minuman Impianmu?
        </h3>
        <p className="text-sm text-white/90 max-w-md mx-auto">
          Jelajahi seluruh koleksi rasa favoritmu sekarang dan rasakan kelezatan sejati dalam setiap tegukan.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#7652A8] hover:bg-[#FAF5FF] font-poppins font-bold text-sm rounded-xl shadow-md transition-all hover:scale-105"
        >
          <span>Belanja di Katalog</span>
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
