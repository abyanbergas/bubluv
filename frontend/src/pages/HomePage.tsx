import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CategoryCard } from '../components/CategoryCard';
import {
  SparklesIcon,
  ShieldCheckIcon,
  TruckIcon,
  StarIcon,
  ChevronRightIcon,
  CartIcon,
} from '../components/SvgIcons';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const { categories, settings } = useStore();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const [bestRes, newRes] = await Promise.allSettled([
          api.get('/products?best_seller=true&per_page=4'),
          api.get('/products?new_arrival=true&per_page=4'),
        ]);

        if (bestRes.status === 'fulfilled' && bestRes.value.data?.success) {
          setBestSellers(bestRes.value.data.data);
        }
        if (newRes.status === 'fulfilled' && newRes.value.data?.success) {
          setNewArrivals(newRes.value.data.data);
        }
      } catch (err) {
        console.error('Error fetching homepage products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  const benefits = [
    {
      icon: <SparklesIcon className="w-8 h-8 text-[#7652A8]" />,
      title: 'Bahan Baku Premium',
      description: 'Diformulasikan dari bahan baku pilihan standar kafe bintang lima dengan rasa pekat dan wangi alami.',
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8 text-[#7652A8]" />,
      title: 'Higienis & Teruji',
      description: 'Diproduksi dengan standar higienitas ketat, tanpa pengawet berbahaya, dan aman dikonsumsi harian.',
    },
    {
      icon: <TruckIcon className="w-8 h-8 text-[#7652A8]" />,
      title: 'Pengiriman Cepat & Aman',
      description: 'Kemasan standing pouch berlapis zipper kedap udara, dipacking rapi siap kirim ke seluruh pelosok nusantara.',
    },
    {
      icon: <StarIcon className="w-8 h-8 text-[#7652A8]" />,
      title: 'Solusi Usaha Minuman',
      description: 'Pilihan tepat untuk pemilik cafe, kedai boba, maupun seduhan santai bersama keluarga.',
    },
  ];

  const testimonials = [
    {
      name: 'Rian Pratama',
      role: 'Owner "Kopi & Boba Senja", Bandung',
      content: 'BubLuv Strawberry Milk dan Matcha Lattemya bener-bener laris manis di kafe kami! Konsumen suka banget karena rasanya creamy pekat dan gak bikin seret.',
      rating: 5,
    },
    {
      name: 'Jessica Tanuwijaya',
      role: 'Home Brewer & Influencer, Jakarta',
      content: 'Taro Milk BubLuv warnanya cantik banget dan wanginya semerbak! Bikin minuman ala kafe di rumah jadi gampang dan jauh lebih hemat.',
      rating: 5,
    },
    {
      name: 'Agus Setiawan',
      role: 'Pemilik Usaha Minuman Kekinian, Surabaya',
      content: 'Pelayanan cepat, pengiriman aman, dan margin keuntungan usaha jadi optimal berkat harga grosir BubLuv.',
      rating: 5,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#F5A8D0]/40 to-[#7652A8]/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#E5DCEC] shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5A8D0] animate-ping" />
                <span className="text-xs font-bold text-[#7652A8] uppercase tracking-wider">
                  Bubuk Minuman Kekinian #1
                </span>
              </div>

              <h1 className="font-poppins font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#35264A] tracking-tight leading-[1.15]">
                Your Favorite Flavors, <br />
                <span className="bg-gradient-to-r from-[#7652A8] to-[#F5A8D0] bg-clip-text text-transparent">
                  Made with Love.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#746A7E] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Nikmati sensasi kelezatan bubuk minuman premium dengan rasa autentik yang manis, creamy, dan segar. Cocok untuk usaha kafe kekinian maupun racikan santai di rumah.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-8 py-4 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Belanja Sekarang</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
                <a
                  href="#categories"
                  className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-[#35264A] hover:text-[#7652A8] font-poppins font-bold text-base rounded-2xl border border-[#E5DCEC] shadow-xs transition-all duration-300 text-center"
                >
                  Lihat Varian Rasa
                </a>
              </div>

              {/* Trust Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E5DCEC]/60 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-poppins font-extrabold text-2xl text-[#35264A]">100%</p>
                  <p className="text-xs text-[#746A7E] font-medium">Bahan Pilihan</p>
                </div>
                <div>
                  <p className="font-poppins font-extrabold text-2xl text-[#35264A]">5</p>
                  <p className="text-xs text-[#746A7E] font-medium">Kategori Seri Rasa</p>
                </div>
                <div>
                  <p className="font-poppins font-extrabold text-2xl text-[#35264A]">5.0★</p>
                  <p className="text-xs text-[#746A7E] font-medium">Ulasan Pembeli</p>
                </div>
              </div>
            </div>

            {/* Hero Visual Banner */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-white p-6 shadow-2xl border border-[#E5DCEC] flex items-center justify-center">
                <img
                  src="/images/products/strawberry-milk.png"
                  alt="BubLuv Strawberry Milk"
                  className="w-full h-full object-contain drop-shadow-xl animate-pulse"
                />

                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E5DCEC] shadow-lg flex items-center gap-2">
                  <span className="text-xl">🍓</span>
                  <div>
                    <p className="text-[10px] text-[#746A7E] font-bold uppercase">Favorit Pelanggan</p>
                    <p className="text-xs font-extrabold text-[#35264A]">Strawberry Milk</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E5DCEC] shadow-lg flex items-center gap-2">
                  <span className="text-xl">🍵</span>
                  <div>
                    <p className="text-[10px] text-[#746A7E] font-bold uppercase">Japanese Uji Matcha</p>
                    <p className="text-xs font-extrabold text-[#7652A8]">Premium Grade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider bg-white/80 px-3 py-1 rounded-full border border-[#E5DCEC]">
            Katalog Lengkap
          </span>
          <h2 className="font-poppins font-extrabold text-3xl sm:text-4xl text-[#35264A]">
            Kategori Seri Varian Rasa
          </h2>
          <p className="text-sm text-[#746A7E]">
            Temukan paduan rasa favoritmu dari serial buah segar, teh matcha otentik, cokelat mewah, hingga olahan creamy yang lezat.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 3. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider">
              Pilihan Paling Populer
            </span>
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A] mt-1">
              Produk Terlaris (Best Sellers)
            </h2>
          </div>
          <Link
            to="/shop?sort=popular"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7652A8] hover:text-[#5D3F87] bg-white px-4 py-2 rounded-xl border border-[#E5DCEC] transition-colors"
          >
            <span>Lihat Semua Produk</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. PROMOTIONAL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#7652A8] to-[#F5A8D0] p-8 sm:p-12 text-white shadow-xl overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-10 translate-y-10 pointer-events-none">
            <CartIcon className="w-80 h-80 text-white" />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Paket Kemitraan & Reseller
            </span>
            <h3 className="font-poppins font-extrabold text-2xl sm:text-4xl leading-tight">
              Hemat Hingga 20% Untuk Pembelian Grosir Kafe & Usaha
            </h3>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              Dapatkan potongan harga spesial kemasan 1 Kilogram untuk suplai bisnis minuman boba, kafe, dan restoran Anda. Hubungi kami untuk konsultasi menu gratis.
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#7652A8] hover:bg-[#FAF5FF] font-poppins font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-105"
              >
                <span>Beli Paket Hemat Sekarang</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider">
              Varian Terbaru
            </span>
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A] mt-1">
              Produk Baru (New Arrivals)
            </h2>
          </div>
          <Link
            to="/shop?sort=latest"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7652A8] hover:text-[#5D3F87] bg-white px-4 py-2 rounded-xl border border-[#E5DCEC] transition-colors"
          >
            <span>Jelajahi Rasa Baru</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. BRAND BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-[#E5DCEC] p-6 text-center space-y-3 hover:shadow-lg transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#E9DDFB]/60 flex items-center justify-center mx-auto">
                {b.icon}
              </div>
              <h4 className="font-poppins font-bold text-base text-[#35264A]">
                {b.title}
              </h4>
              <p className="text-xs text-[#746A7E] leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold text-[#7652A8] uppercase tracking-wider bg-white/80 px-3 py-1 rounded-full border border-[#E5DCEC]">
            Ulasan Nyata
          </span>
          <h2 className="font-poppins font-extrabold text-3xl text-[#35264A]">
            Apa Kata Mereka Tentang BubLuv?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-[#E5DCEC] p-6 flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex gap-1 text-[#FFB800]">
                  {[...Array(t.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4" />
                  ))}
                </div>
                <p className="text-sm text-[#35264A] italic leading-relaxed">
                  "{t.content}"
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5DCEC]/60">
                <p className="font-poppins font-bold text-sm text-[#35264A]">{t.name}</p>
                <p className="text-xs text-[#746A7E]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
