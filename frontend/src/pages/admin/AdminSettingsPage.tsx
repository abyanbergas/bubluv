import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { CheckIcon } from '../../components/SvgIcons';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings } = useStore();

  const [form, setForm] = useState<Record<string, string>>({
    store_name: '',
    store_tagline: '',
    store_description: '',
    store_phone: '',
    store_whatsapp: '',
    store_email: '',
    store_address: '',
    store_instagram: '',
    store_tiktok: '',
    bank_bca_number: '',
    bank_bca_holder: '',
    bank_bri_number: '',
    bank_bri_holder: '',
    enable_cod: '1',
    enable_manual_bank: '1',
    enable_payment_gateway: '1',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data?.success) {
          setForm((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      const res = await api.post('/admin/settings', form);
      if (res.data?.success) {
        setSuccessMsg(true);
        refreshSettings();
        setTimeout(() => setSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#746A7E]">
        Memuat konfigurasi toko...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
          Pengaturan Toko & Informasi Operasional
        </h1>
        <p className="text-xs text-[#746A7E]">
          Ubah identitas profil toko, kontak WhatsApp, rekening bank resmi, dan kontrol fitur pembayaran.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan toko berhasil disimpan ke database.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Brand */}
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4 shadow-xs">
          <h3 className="font-poppins font-bold text-base text-[#35264A] pb-2 border-b border-[#E5DCEC]">
            Profil & Identitas Toko
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Nama Toko *</label>
              <input
                type="text"
                required
                value={form.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Slogan / Tagline Brand</label>
              <input
                type="text"
                value={form.store_tagline}
                onChange={(e) => handleChange('store_tagline', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Deskripsi Toko (Muncul pada Footer & Meta SEO)</label>
            <textarea
              rows={2}
              value={form.store_description}
              onChange={(e) => handleChange('store_description', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
            />
          </div>
        </div>

        {/* Kontak & Alamat */}
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4 shadow-xs">
          <h3 className="font-poppins font-bold text-base text-[#35264A] pb-2 border-b border-[#E5DCEC]">
            Kontak & Alamat
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Nomor WhatsApp (Contoh: 6281234567890)</label>
              <input
                type="text"
                value={form.store_whatsapp}
                onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Telepon Kantor</label>
              <input
                type="text"
                value={form.store_phone}
                onChange={(e) => handleChange('store_phone', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Email Resmi</label>
              <input
                type="email"
                value={form.store_email}
                onChange={(e) => handleChange('store_email', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Alamat Fisik Toko</label>
            <textarea
              rows={2}
              value={form.store_address}
              onChange={(e) => handleChange('store_address', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Instagram URL</label>
              <input
                type="url"
                value={form.store_instagram}
                onChange={(e) => handleChange('store_instagram', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">TikTok URL</label>
              <input
                type="url"
                value={form.store_tiktok}
                onChange={(e) => handleChange('store_tiktok', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Rekening Bank & Kontrol Pembayaran */}
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4 shadow-xs">
          <h3 className="font-poppins font-bold text-base text-[#35264A] pb-2 border-b border-[#E5DCEC]">
            Konfigurasi Rekening Bank & Metode Pembayaran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] space-y-3">
              <h4 className="font-bold text-xs text-[#35264A]">Rekening Bank BCA</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#746A7E]">Nomor Rekening BCA</label>
                <input
                  type="text"
                  value={form.bank_bca_number}
                  onChange={(e) => handleChange('bank_bca_number', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#746A7E]">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={form.bank_bca_holder}
                  onChange={(e) => handleChange('bank_bca_holder', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] space-y-3">
              <h4 className="font-bold text-xs text-[#35264A]">Rekening Bank BRI</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#746A7E]">Nomor Rekening BRI</label>
                <input
                  type="text"
                  value={form.bank_bri_number}
                  onChange={(e) => handleChange('bank_bri_number', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#746A7E]">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={form.bank_bri_holder}
                  onChange={(e) => handleChange('bank_bri_holder', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DCEC] rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 text-xs font-semibold text-[#35264A]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enable_cod === '1'}
                onChange={(e) => handleChange('enable_cod', e.target.checked ? '1' : '0')}
                className="rounded text-[#7652A8]"
              />
              <span>Aktifkan Opsi Cash On Delivery (COD)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enable_manual_bank === '1'}
                onChange={(e) => handleChange('enable_manual_bank', e.target.checked ? '1' : '0')}
                className="rounded text-[#7652A8]"
              />
              <span>Aktifkan Transfer Bank Manual</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enable_payment_gateway === '1'}
                onChange={(e) => handleChange('enable_payment_gateway', e.target.checked ? '1' : '0')}
                className="rounded text-[#7652A8]"
              />
              <span>Aktifkan QRIS & E-Wallet Gateway</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
};
