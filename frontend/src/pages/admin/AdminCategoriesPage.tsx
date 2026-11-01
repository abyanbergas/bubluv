import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Category } from '../../types';
import { PlusIcon, TrashIcon, CloseIcon } from '../../components/SvgIcons';
import { useStore } from '../../context/StoreContext';

export const AdminCategoriesPage: React.FC = () => {
  const { refreshSettings } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsActive(cat.is_active);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, {
          name,
          description,
          is_active: isActive,
        });
        setAlertMsg({ text: 'Kategori berhasil diperbarui.', type: 'success' });
      } else {
        await api.post('/admin/categories', {
          name,
          description,
          is_active: isActive,
        });
        setAlertMsg({ text: 'Kategori baru berhasil dibuat.', type: 'success' });
      }
      setModalOpen(false);
      fetchCategories();
      refreshSettings();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan kategori.';
      setAlertMsg({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      if (res.data?.success) {
        setAlertMsg({ text: 'Kategori berhasil dihapus.', type: 'success' });
        fetchCategories();
        refreshSettings();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menghapus kategori.';
      setAlertMsg({ text: msg, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
            Kategori Varian Rasa
          </h1>
          <p className="text-xs text-[#746A7E]">
            Kelola pengelompokan seri rasa minuman untuk memudahkan navigasi pembeli di katalog.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Kategori</span>
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

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px] border-b border-[#E5DCEC]">
              <tr>
                <th className="p-3.5">Nama Kategori</th>
                <th className="p-3.5">Slug URL</th>
                <th className="p-3.5">Deskripsi</th>
                <th className="p-3.5">Total Produk</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#746A7E]">
                    Memuat kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#746A7E]">
                    Belum ada kategori varian.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[#35264A]">{c.name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-[#7652A8]">{c.slug}</td>
                    <td className="p-3.5 text-[#746A7E] max-w-xs truncate">{c.description || '-'}</td>
                    <td className="p-3.5">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-[#E9DDFB]/60 text-[#7652A8] text-[11px]">
                        {c.products_count || 0} Produk
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="px-3 py-1 bg-[#E9DDFB]/60 hover:bg-[#E9DDFB] text-[#7652A8] font-bold rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
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

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
              <h3 className="font-poppins font-bold text-base text-[#35264A]">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#746A7E]">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Strawberry Series"
                  className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan keunikan rasa seri ini..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#7652A8]"
                  />
                  <span>Kategori Aktif & Ditampilkan di Katalog</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E5DCEC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF5FF] text-xs font-bold text-[#35264A] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#7652A8] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
