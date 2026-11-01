import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { formatRupiah } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SearchIcon, ChevronDownIcon, CloseIcon } from '../components/SvgIcons';
import { useStore } from '../context/StoreContext';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // Filter States
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'latest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const inStock = searchParams.get('in_stock') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number | boolean> = {
          page,
          sort,
        };

        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (inStock) params.in_stock = true;

        const res = await api.get('/products', { params });
        if (res.data?.success) {
          setProducts(res.data.data);
          setMeta(res.data.meta);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [search, selectedCategory, sort, minPrice, maxPrice, inStock, page]);

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const goToPage = (pageNum: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(pageNum));
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPriceInput) newParams.set('min_price', minPriceInput);
    else newParams.delete('min_price');

    if (maxPriceInput) newParams.set('max_price', maxPriceInput);
    else newParams.delete('max_price');

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    inStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header & Page Title */}
      <div className="mb-8 space-y-2">
        <h1 className="font-poppins font-extrabold text-3xl sm:text-4xl text-[#35264A]">
          Katalog Bubuk Minuman
        </h1>
        <p className="text-sm text-[#746A7E]">
          Temukan aneka varian rasa bubuk minuman kekinian berkualitas tinggi untuk usahamu atau seduhan nikmat di rumah.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FILTERS SIDEBAR (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
              <h3 className="font-poppins font-bold text-base text-[#35264A]">Filter Produk</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-[#7652A8] hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Search Filter */}
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <label className="text-xs font-bold text-[#35264A] uppercase tracking-wider block">
                Cari Kata Kunci
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Misal: Strawberry, Taro..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8] text-[#35264A]"
                />
                <SearchIcon className="w-4 h-4 text-[#746A7E] absolute left-3 top-2.5" />
              </div>
            </form>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#35264A] uppercase tracking-wider block">
                Kategori Varian
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    !selectedCategory
                      ? 'bg-[#E9DDFB] text-[#7652A8]'
                      : 'text-[#746A7E] hover:bg-[#FAF5FF]'
                  }`}
                >
                  <span>Semua Kategori</span>
                  <span>({meta.total})</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('category', c.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategory === c.slug
                        ? 'bg-[#E9DDFB] text-[#7652A8]'
                        : 'text-[#746A7E] hover:bg-[#FAF5FF]'
                    }`}
                  >
                    <span>{c.name}</span>
                    {c.products_count !== undefined && (
                      <span className="text-[10px] text-[#746A7E]">({c.products_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <form onSubmit={handlePriceApply} className="space-y-2">
              <label className="text-xs font-bold text-[#35264A] uppercase tracking-wider block">
                Rentang Harga (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
                />
                <input
                  type="number"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-[#7652A8] text-white font-bold text-xs rounded-xl hover:bg-[#5D3F87] transition-colors"
              >
                Terapkan Harga
              </button>
            </form>

            {/* In Stock Only Filter */}
            <div className="pt-2 border-t border-[#E5DCEC]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#35264A]">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
                  className="rounded border-[#E5DCEC] text-[#7652A8] focus:ring-[#7652A8]"
                />
                <span>Hanya Tampilkan Stok Tersedia</span>
              </label>
            </div>
          </div>
        </aside>

        {/* CATALOG CONTENT */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Controls: Sorting & Filter Toggle */}
          <div className="bg-white rounded-2xl border border-[#E5DCEC] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#746A7E] font-medium w-full sm:w-auto">
              Menampilkan <span className="font-bold text-[#35264A]">{products.length}</span> dari{' '}
              <span className="font-bold text-[#35264A]">{meta.total}</span> produk
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden px-4 py-2 bg-[#E9DDFB]/50 hover:bg-[#E9DDFB] text-[#7652A8] font-bold text-xs rounded-xl"
              >
                Filter Produk
              </button>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#746A7E]">Urutkan:</span>
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl text-xs font-semibold text-[#35264A] focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
                >
                  <option value="latest">Terbaru</option>
                  <option value="price_asc">Harga: Rendah ke Tinggi</option>
                  <option value="price_desc">Harga: Tinggi ke Rendah</option>
                  <option value="popular">Paling Populer</option>
                  <option value="name_asc">Nama A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#746A7E]">Filter aktif:</span>
              {search && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#E5DCEC] px-2.5 py-1 rounded-full text-[#35264A]">
                  Kata kunci: "{search}"
                  <button onClick={() => updateParam('search', null)}>
                    <CloseIcon className="w-3 h-3 text-[#746A7E] hover:text-red-500" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#E5DCEC] px-2.5 py-1 rounded-full text-[#35264A]">
                  Kategori: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => updateParam('category', null)}>
                    <CloseIcon className="w-3 h-3 text-[#746A7E] hover:text-red-500" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#E5DCEC] px-2.5 py-1 rounded-full text-[#35264A]">
                  Harga: Rp {minPrice || '0'} - Rp {maxPrice || '∞'}
                  <button
                    onClick={() => {
                      setMinPriceInput('');
                      setMaxPriceInput('');
                      const p = new URLSearchParams(searchParams);
                      p.delete('min_price');
                      p.delete('max_price');
                      setSearchParams(p);
                    }}
                  >
                    <CloseIcon className="w-3 h-3 text-[#746A7E] hover:text-red-500" />
                  </button>
                </span>
              )}
              {inStock && (
                <span className="inline-flex items-center gap-1 text-xs bg-white border border-[#E5DCEC] px-2.5 py-1 rounded-full text-[#35264A]">
                  Stok Tersedia
                  <button onClick={() => updateParam('in_stock', null)}>
                    <CloseIcon className="w-3 h-3 text-[#746A7E] hover:text-red-500" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-[#E5DCEC] space-y-3 animate-pulse">
                  <div className="w-full aspect-square bg-[#E9DDFB]/30 rounded-2xl" />
                  <div className="h-4 bg-[#E9DDFB]/40 rounded w-1/3" />
                  <div className="h-4 bg-[#E9DDFB]/60 rounded w-3/4" />
                  <div className="h-5 bg-[#E9DDFB]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E5DCEC] p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-[#E9DDFB]/50 rounded-full flex items-center justify-center mx-auto text-[#7652A8]">
                <SearchIcon className="w-10 h-10" />
              </div>
              <h3 className="font-poppins font-bold text-lg text-[#35264A]">
                Tidak Ada Produk yang Cocok
              </h3>
              <p className="text-sm text-[#746A7E] max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau reset filter untuk menemukan varian rasa bubuk minuman lainnya.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-[#7652A8] text-white font-poppins font-bold text-xs rounded-xl hover:bg-[#5D3F87] transition-all"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="pt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#E5DCEC] text-[#35264A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF5FF]"
              >
                Sebelumnya
              </button>

              {[...Array(meta.last_page)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      meta.current_page === pageNum
                        ? 'bg-[#7652A8] text-white shadow-xs'
                        : 'bg-white border border-[#E5DCEC] text-[#35264A] hover:bg-[#FAF5FF]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#E5DCEC] text-[#35264A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF5FF]"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
                  <h3 className="font-poppins font-bold text-base text-[#35264A]">Filter Produk</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-[#746A7E]"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="space-y-2">
                  <label className="text-xs font-bold text-[#35264A]">Cari Kata Kunci</label>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari rasa..."
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </form>

                {/* Mobile Categories */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#35264A]">Kategori</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        updateParam('category', null);
                        setMobileFilterOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium"
                    >
                      Semua Kategori
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          updateParam('category', c.slug);
                          setMobileFilterOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-[#7652A8] text-white font-bold text-xs rounded-xl"
              >
                Tutup & Tampilkan Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
