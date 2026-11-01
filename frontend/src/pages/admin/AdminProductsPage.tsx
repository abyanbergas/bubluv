import React, { useState, useEffect } from 'react';
import api, { formatRupiah, getImageUrl } from '../../services/api';
import { Product, Category, ProductVariant } from '../../types';
import { PlusIcon, TrashIcon, SearchIcon, CloseIcon, CheckIcon } from '../../components/SvgIcons';
import { useStore } from '../../context/StoreContext';

export const AdminProductsPage: React.FC = () => {
  const { categories } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [servingSuggestion, setServingSuggestion] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(50);
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState<number | ''>(500);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Variants in Modal Form
  const [variants, setVariants] = useState<{ id?: number; variant_name: string; price_adjustment: number; stock: number; sku?: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (selectedCat) params.category_id = selectedCat;

      const res = await api.get('/admin/products', { params });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat]);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setIngredients('');
    setServingSuggestion('');
    setPrice(65000);
    setSalePrice('');
    setStock(50);
    setSku(`BLV-${Date.now().toString().slice(-4)}`);
    setWeight(500);
    setIsActive(true);
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsNewArrival(true);
    setImageFile(null);
    setImagePreview(null);
    setVariants([
      { variant_name: 'Kemasan 500 Gram (Regular)', price_adjustment: 0, stock: 30, sku: '' },
      { variant_name: 'Kemasan 1 Kilogram (Hemat)', price_adjustment: 45000, stock: 20, sku: '' },
    ]);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setCategoryId(p.category_id);
    setDescription(p.description || '');
    setIngredients(p.ingredients || '');
    setServingSuggestion(p.serving_suggestion || '');
    setPrice(p.price);
    setSalePrice(p.sale_price || '');
    setStock(p.stock);
    setSku(p.sku || '');
    setWeight(p.weight);
    setIsActive(p.is_active);
    setIsFeatured(p.is_featured);
    setIsBestSeller(p.is_best_seller);
    setIsNewArrival(p.is_new_arrival);
    setImageFile(null);
    setImagePreview(p.image ? getImageUrl(p.image) : null);

    if (p.variants && p.variants.length > 0) {
      setVariants(p.variants.map((v) => ({
        id: v.id,
        variant_name: v.variant_name,
        price_adjustment: v.price_adjustment,
        stock: v.stock,
        sku: v.sku || '',
      })));
    } else {
      setVariants([]);
    }
    setModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { variant_name: '', price_adjustment: 0, stock: 10, sku: '' }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, val: any) => {
    const next = [...variants];
    (next[index] as any)[field] = val;
    setVariants(next);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', String(categoryId));
    formData.append('description', description);
    formData.append('ingredients', ingredients);
    formData.append('serving_suggestion', servingSuggestion);
    formData.append('price', String(price));
    if (salePrice !== '') formData.append('sale_price', String(salePrice));
    formData.append('stock', String(stock));
    formData.append('sku', sku);
    formData.append('weight', String(weight));
    formData.append('is_active', isActive ? '1' : '0');
    formData.append('is_featured', isFeatured ? '1' : '0');
    formData.append('is_best_seller', isBestSeller ? '1' : '0');
    formData.append('is_new_arrival', isNewArrival ? '1' : '0');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    variants.forEach((v, i) => {
      if (v.id) formData.append(`variants[${i}][id]`, String(v.id));
      formData.append(`variants[${i}][variant_name]`, v.variant_name);
      formData.append(`variants[${i}][price_adjustment]`, String(v.price_adjustment));
      formData.append(`variants[${i}][stock]`, String(v.stock));
      if (v.sku) formData.append(`variants[${i}][sku]`, v.sku);
    });

    try {
      if (editingId) {
        await api.post(`/admin/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAlertMsg({ text: 'Produk berhasil diperbarui.', type: 'success' });
      } else {
        await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAlertMsg({ text: 'Produk baru berhasil ditambahkan.', type: 'success' });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan produk.';
      setAlertMsg({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus produk ini dari katalog?')) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      if (res.data?.success) {
        setAlertMsg({ text: 'Produk berhasil dihapus.', type: 'success' });
        fetchProducts();
      }
    } catch (err: any) {
      setAlertMsg({ text: 'Gagal menghapus produk.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
            Manajemen Produk
          </h1>
          <p className="text-xs text-[#746A7E]">
            Kelola katalog bubuk minuman, atur harga, varian kemasan, dan kontrol ketersediaan stok.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {alertMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alertMsg.text}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DCEC] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau SKU produk..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
          />
          <SearchIcon className="w-4 h-4 text-[#746A7E] absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl text-xs font-semibold text-[#35264A]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px] border-b border-[#E5DCEC]">
              <tr>
                <th className="p-3.5">Produk</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Harga</th>
                <th className="p-3.5">Total Stok</th>
                <th className="p-3.5">Varian</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#746A7E]">
                    Memuat data produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#746A7E]">
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF5FF] border border-[#E5DCEC] p-1 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={getImageUrl(p.image)}
                          alt={p.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#35264A] truncate max-w-xs">{p.name}</p>
                        <p className="text-[10px] text-[#746A7E]">SKU: {p.sku || '-'}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-[#746A7E]">
                      {p.category?.name || '-'}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-[#7652A8]">{formatRupiah(p.price)}</p>
                      {p.sale_price && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Promo: {formatRupiah(p.sale_price)}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                          p.stock <= 20
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.stock} pcs
                      </span>
                    </td>
                    <td className="p-3.5">
                      {p.variants && p.variants.length > 0 ? (
                        <span className="text-[11px] font-semibold text-[#7652A8] bg-[#E9DDFB]/50 px-2 py-0.5 rounded-md">
                          {p.variants.length} Varian
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#746A7E]">Standar</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1 bg-[#E9DDFB]/60 hover:bg-[#E9DDFB] text-[#7652A8] font-bold rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
              <h3 className="font-poppins font-bold text-lg text-[#35264A]">
                {editingId ? 'Edit Produk BubLuv' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#746A7E] hover:bg-[#FAF5FF] rounded-xl"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Kategori Varian *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Harga Normal (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Harga Promo (Opsional)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Stok Tersedia *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Berat (Gram) *</label>
                  <input
                    type="number"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">SKU Induk</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="BLV-STR-500"
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Foto Produk (JPG/PNG/WebP)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="text-xs text-[#746A7E] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E9DDFB] file:text-[#7652A8]"
                  />
                  {imagePreview && (
                    <div className="w-12 h-12 mt-2 rounded-xl overflow-hidden border border-[#E5DCEC]">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Komposisi Bahan</label>
                  <textarea
                    rows={2}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#35264A]">Saran Penyajian</label>
                  <textarea
                    rows={2}
                    value={servingSuggestion}
                    onChange={(e) => setServingSuggestion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="pt-2 border-t border-[#E5DCEC] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#35264A]">
                    Varian Kemasan / Ukuran (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-[11px] font-bold text-[#7652A8] hover:underline"
                  >
                    + Tambah Varian
                  </button>
                </div>

                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-[#FAF5FF] p-2 rounded-xl border border-[#E5DCEC]">
                    <input
                      type="text"
                      placeholder="Nama Varian (misal: Kemasan 1 Kg)"
                      value={v.variant_name}
                      onChange={(e) => handleVariantChange(i, 'variant_name', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="+Harga (Rp)"
                      value={v.price_adjustment}
                      onChange={(e) => handleVariantChange(i, 'price_adjustment', Number(e.target.value))}
                      className="w-24 px-2 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stok"
                      value={v.stock}
                      onChange={(e) => handleVariantChange(i, 'stock', Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantRow(i)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-[#E5DCEC] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#7652A8]"
                  />
                  <span>Produk Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-[#7652A8]"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded text-[#7652A8]"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded text-[#7652A8]"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E5DCEC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-[#FAF5FF] text-[#35264A] font-bold text-xs rounded-xl border border-[#E5DCEC]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
