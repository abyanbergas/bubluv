import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { formatRupiah, getImageUrl } from '../services/api';
import { Product, ProductVariant } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  CartIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '../components/SvgIcons';
import { useCart } from '../context/CartContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'serving'>('desc');
  const [loading, setLoading] = useState<boolean>(true);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data?.success) {
          const prod: Product = res.data.data;
          setProduct(prod);
          setRelated(res.data.related || []);
          if (prod.active_variants && prod.active_variants.length > 0) {
            setSelectedVariant(prod.active_variants[0]);
          } else {
            setSelectedVariant(null);
          }
          setQuantity(1);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDetail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 border-4 border-[#7652A8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#746A7E] font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-poppins font-bold text-2xl text-[#35264A]">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-[#746A7E]">Produk yang Anda cari mungkin sudah tidak tersedia atau telah dipindahkan.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-[#7652A8] text-white font-bold text-sm rounded-xl"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const basePrice = (product.sale_price && product.sale_price < product.price)
    ? product.sale_price
    : product.price;

  const currentPrice = basePrice + (selectedVariant ? selectedVariant.price_adjustment : 0);
  const originalPrice = product.price + (selectedVariant ? selectedVariant.price_adjustment : 0);
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  const maxStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = maxStock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, selectedVariant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addToCart(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-[#746A7E]">
        <Link to="/" className="hover:text-[#7652A8]">Home</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#7652A8]">Katalog</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        {product.category && (
          <>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-[#7652A8]">
              {product.category.name}
            </Link>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </>
        )}
        <span className="font-semibold text-[#35264A] truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="w-full aspect-square rounded-3xl bg-white border border-[#E5DCEC] p-8 shadow-sm flex items-center justify-center relative overflow-hidden">
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
            {hasDiscount && (
              <span className="absolute top-6 left-6 bg-[#F5A8D0] text-[#35264A] text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                HEMAT PROMO
              </span>
            )}
          </div>
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            {product.category && (
              <span className="text-xs font-bold text-[#7652A8] uppercase tracking-wider bg-[#E9DDFB]/60 px-3 py-1 rounded-full inline-block">
                {product.category.name}
              </span>
            )}
            <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A]">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-[#746A7E] pt-1">
              <span>SKU: <strong className="text-[#35264A]">{selectedVariant?.sku || product.sku || '-'}</strong></span>
              <span>•</span>
              <span>Berat Bersih: <strong className="text-[#35264A]">{product.weight} gram</strong></span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DCEC] space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="font-poppins font-extrabold text-3xl text-[#7652A8]">
                {formatRupiah(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[#746A7E] line-through">
                  {formatRupiah(originalPrice)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#746A7E]">
              * Harga sudah termasuk kemasan standing pouch kedap udara standar kualitas kafe.
            </p>
          </div>

          {/* Variants Selection */}
          {product.active_variants && product.active_variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#35264A] uppercase tracking-wider block">
                Pilih Ukuran / Varian Kemasan:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.active_variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                        isSelected
                          ? 'border-[#7652A8] bg-[#E9DDFB]/60 text-[#7652A8] ring-2 ring-[#7652A8]/30'
                          : 'border-[#E5DCEC] bg-white text-[#35264A] hover:bg-[#FAF5FF]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && <CheckIcon className="w-3.5 h-3.5 text-[#7652A8]" />}
                        <span>{v.variant_name}</span>
                      </div>
                      {v.price_adjustment !== 0 && (
                        <span className="text-[10px] text-[#746A7E] block mt-0.5">
                          {v.price_adjustment > 0 ? `+${formatRupiah(v.price_adjustment)}` : formatRupiah(v.price_adjustment)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & Quantity Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#35264A]">
              <span>Jumlah Pembelian:</span>
              <span>
                {inStock ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    Stok Tersedia: {maxStock} pcs
                  </span>
                ) : (
                  <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-semibold">
                    Stok Habis
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#E5DCEC] rounded-xl bg-white overflow-hidden p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !inStock}
                  className="p-2 hover:bg-[#E9DDFB]/40 text-[#35264A] disabled:opacity-30"
                  aria-label="Kurang"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-[#35264A]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={quantity >= maxStock || !inStock}
                  className="p-2 hover:bg-[#E9DDFB]/40 text-[#35264A] disabled:opacity-30"
                  aria-label="Tambah"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-[#746A7E]">
                Subtotal: <strong className="text-[#35264A]">{formatRupiah(currentPrice * quantity)}</strong>
              </span>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#E9DDFB] hover:bg-[#D8B4F8] text-[#7652A8] font-poppins font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CartIcon className="w-5 h-5" />
              <span>Tambah ke Keranjang</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Beli Sekarang
            </button>
          </div>

          {/* Success Toast Banner */}
          {addedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckIcon className="w-4 h-4 text-emerald-600" />
              <span>Berhasil ditambahkan ke keranjang belanja!</span>
            </div>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E5DCEC]/60 text-xs text-[#746A7E]">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-[#7652A8]" />
              <span>100% Produk Halal & Higienis</span>
            </div>
            <div className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-[#7652A8]" />
              <span>Kemasan Aman & Kedap Udara</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Ingredients, Serving Suggestion */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 sm:p-8 space-y-6">
        <div className="flex border-b border-[#E5DCEC] gap-6 text-sm font-poppins font-bold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'desc'
                ? 'border-[#7652A8] text-[#7652A8]'
                : 'border-transparent text-[#746A7E] hover:text-[#35264A]'
            }`}
          >
            Deskripsi Produk
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'ingredients'
                ? 'border-[#7652A8] text-[#7652A8]'
                : 'border-transparent text-[#746A7E] hover:text-[#35264A]'
            }`}
          >
            Komposisi Bahan
          </button>
          <button
            onClick={() => setActiveTab('serving')}
            className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'serving'
                ? 'border-[#7652A8] text-[#7652A8]'
                : 'border-transparent text-[#746A7E] hover:text-[#35264A]'
            }`}
          >
            Petunjuk Penyajian
          </button>
        </div>

        <div className="text-sm text-[#746A7E] leading-relaxed">
          {activeTab === 'desc' && (
            <p className="whitespace-pre-line">
              {product.description || 'Tidak ada deskripsi tambahan.'}
            </p>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-2">
              <p className="font-semibold text-[#35264A]">Bahan-bahan Pilihan:</p>
              <p className="whitespace-pre-line">
                {product.ingredients || 'Gula pasir alami, krimer nabati non-dairy, perisa sintetik, susu bubuk skim.'}
              </p>
            </div>
          )}

          {activeTab === 'serving' && (
            <div className="space-y-3">
              <p className="font-semibold text-[#35264A]">Saran Penyajian BubLuv:</p>
              <p className="whitespace-pre-line">
                {product.serving_suggestion || 'Larutkan 30-40 gram bubuk BubLuv ke dalam 100ml air hangat. Aduk rata, lalu tambahkan es batu dan susu cair segar secukupnya. Siap dinikmati!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-6 pt-6">
          <h2 className="font-poppins font-extrabold text-2xl text-[#35264A]">
            Produk Terkait yang Mungkin Anda Sukai
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
