import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { formatRupiah, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  BankBcaIcon,
  BankBriIcon,
  QrisIcon,
  EwalletIcon,
  CodIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from '../components/SvgIcons';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useStore();

  // Form State
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [province, setProvince] = useState('DKI Jakarta');
  const [city, setCity] = useState('Jakarta Selatan');
  const [district, setDistrict] = useState('Kebayoran Baru');
  const [postalCode, setPostalCode] = useState('12110');
  const [notes, setNotes] = useState('');

  // Shipping Method
  const shippingOptions = [
    { id: 'Reguler (2-3 Hari)', name: 'Kurir Reguler (JNE / SiCepat / AnterAja)', cost: 15000, desc: 'Estimasi tiba 2-3 hari kerja' },
    { id: 'Next Day (1 Hari)', name: 'Next Day / Kilat', cost: 25000, desc: 'Estimasi tiba besok hari' },
    { id: 'Instant (Jabodetabek)', name: 'Instant Delivery (Grab / Gojek)', cost: 35000, desc: 'Tiba dalam 2-4 jam setelah diproses' },
    { id: 'Ambil di Toko', name: 'Pickup / Ambil Mandiri di Toko', cost: 0, desc: 'Ambil langsung di gerai resmi BubLuv' },
  ];
  const [shippingMethod, setShippingMethod] = useState(shippingOptions[0].id);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'manual_transfer' | 'gateway_qris' | 'gateway_ewallet' | 'gateway_va' | 'cod'>('manual_transfer');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-poppins font-bold text-2xl text-[#35264A]">Keranjang Belanja Kosong</h2>
        <p className="text-sm text-[#746A7E]">Pilih produk bubuk minuman terlebih dahulu sebelum melakukan checkout.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-[#7652A8] text-white font-bold text-sm rounded-xl"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  const selectedShipping = shippingOptions.find((s) => s.id === shippingMethod) || shippingOptions[0];
  const shippingCost = selectedShipping.cost;
  const grandTotal = subtotal + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recipientName.trim() || !phone.trim() || !addressLine.trim()) {
      setErrorMsg('Mohon lengkapi nama penerima, nomor telepon, dan alamat pengiriman.');
      return;
    }

    setLoading(true);

    try {
      const fullAddress = `${addressLine.trim()}, Kec. ${district.trim()}, Kota/Kab. ${city.trim()}, ${province.trim()} ${postalCode.trim()}`;

      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant ? item.variant.id : null,
        quantity: item.quantity,
      }));

      const res = await api.post('/orders', {
        recipient_name: recipientName.trim(),
        phone: phone.trim(),
        shipping_address: fullAddress,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        items: itemsPayload,
      });

      if (res.data?.success && res.data.data?.order_number) {
        clearCart();
        navigate(`/orders/${res.data.data.order_number}`);
      } else {
        setErrorMsg(res.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan. Periksa koneksi atau stok barang.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-[#746A7E]">
        <Link to="/" className="hover:text-[#7652A8]">Home</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#7652A8]">Shop</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#35264A]">Checkout Pembayaran</span>
      </nav>

      <div className="space-y-1">
        <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A]">
          Checkout & Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-[#746A7E]">
          Lengkapi data alamat pengiriman dan pilih metode pembayaran resmi BubLuv.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4">
            <h3 className="font-poppins font-bold text-base text-[#35264A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#7652A8] text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Informasi Penerima & Alamat Pengiriman</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Nama Penerima *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Nomor WhatsApp / HP *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) *</label>
              <textarea
                required
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Jl. Mawar No. 12, RT 01 RW 02..."
                className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#35264A]">Provinsi</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#35264A]">Kota / Kab.</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#35264A]">Kecamatan</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#35264A]">Kode Pos</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-[#746A7E]">Catatan Pesanan (Opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titip di pos satpam / packing kardus tebal..."
                className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
              />
            </div>
          </div>

          {/* 2. Metode Pengiriman */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4">
            <h3 className="font-poppins font-bold text-base text-[#35264A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#7652A8] text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Pilihan Layanan Pengiriman</span>
            </h3>

            <div className="space-y-2.5">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    shippingMethod === opt.id
                      ? 'border-[#7652A8] bg-[#E9DDFB]/40 ring-1 ring-[#7652A8]'
                      : 'border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.id}
                      checked={shippingMethod === opt.id}
                      onChange={() => setShippingMethod(opt.id)}
                      className="text-[#7652A8] focus:ring-[#7652A8]"
                    />
                    <div>
                      <p className="font-poppins font-bold text-xs text-[#35264A]">{opt.name}</p>
                      <p className="text-[11px] text-[#746A7E]">{opt.desc}</p>
                    </div>
                  </div>
                  <span className="font-poppins font-extrabold text-xs text-[#7652A8]">
                    {opt.cost === 0 ? 'GRATIS' : formatRupiah(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4">
            <h3 className="font-poppins font-bold text-base text-[#35264A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#7652A8] text-white text-xs flex items-center justify-center font-bold">3</span>
              <span>Pilih Metode Pembayaran</span>
            </h3>

            <div className="space-y-3">
              {/* Manual Bank Transfer */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'manual_transfer'
                    ? 'border-[#7652A8] bg-[#E9DDFB]/40 ring-1 ring-[#7652A8]'
                    : 'border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="manual_transfer"
                    checked={paymentMethod === 'manual_transfer'}
                    onChange={() => setPaymentMethod('manual_transfer')}
                    className="mt-1 text-[#7652A8] focus:ring-[#7652A8]"
                  />
                  <div>
                    <p className="font-poppins font-bold text-xs text-[#35264A]">
                      Transfer Bank Manual (BCA & BRI)
                    </p>
                    <p className="text-[11px] text-[#746A7E] mt-0.5">
                      Transfer ke rekening resmi BubLuv. Unggah bukti pembayaran untuk verifikasi cepat oleh admin.
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <BankBcaIcon className="h-5" />
                  <BankBriIcon className="h-5" />
                </div>
              </label>

              {/* QRIS Sandbox */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'gateway_qris'
                    ? 'border-[#7652A8] bg-[#E9DDFB]/40 ring-1 ring-[#7652A8]'
                    : 'border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="gateway_qris"
                    checked={paymentMethod === 'gateway_qris'}
                    onChange={() => setPaymentMethod('gateway_qris')}
                    className="mt-1 text-[#7652A8] focus:ring-[#7652A8]"
                  />
                  <div>
                    <p className="font-poppins font-bold text-xs text-[#35264A]">
                      QRIS — Pembayaran Instan Serbaguna
                    </p>
                    <p className="text-[11px] text-[#746A7E] mt-0.5">
                      Scan kode QR melalui GoPay, OVO, DANA, BCA Mobile, Livin, atau m-Banking apapun.
                    </p>
                  </div>
                </div>
                <QrisIcon className="h-5 flex-shrink-0" />
              </label>

              {/* E-Wallet */}
              <label
                className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'gateway_ewallet'
                    ? 'border-[#7652A8] bg-[#E9DDFB]/40 ring-1 ring-[#7652A8]'
                    : 'border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="gateway_ewallet"
                    checked={paymentMethod === 'gateway_ewallet'}
                    onChange={() => setPaymentMethod('gateway_ewallet')}
                    className="mt-1 text-[#7652A8] focus:ring-[#7652A8]"
                  />
                  <div>
                    <p className="font-poppins font-bold text-xs text-[#35264A]">
                      E-Wallet Digital (GoPay, OVO, DANA, ShopeePay)
                    </p>
                    <p className="text-[11px] text-[#746A7E] mt-0.5">
                      Pembayaran praktis langsung lewat aplikasi dompet digital.
                    </p>
                  </div>
                </div>
                <EwalletIcon className="h-5 flex-shrink-0" />
              </label>

              {/* COD (Conditional) */}
              {settings.enable_cod === '1' && (
                <label
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#7652A8] bg-[#E9DDFB]/40 ring-1 ring-[#7652A8]'
                      : 'border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-[#7652A8] focus:ring-[#7652A8]"
                    />
                    <div>
                      <p className="font-poppins font-bold text-xs text-[#35264A]">
                        Bayar di Tempat (Cash on Delivery - COD)
                      </p>
                      <p className="text-[11px] text-[#746A7E] mt-0.5">
                        Bayar tunai kepada kurir saat pesanan bubuk minuman tiba di alamat Anda.
                      </p>
                    </div>
                  </div>
                  <CodIcon className="h-5 flex-shrink-0" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-5 sticky top-28 shadow-sm">
            <h3 className="font-poppins font-bold text-base text-[#35264A] pb-3 border-b border-[#E5DCEC]">
              Ringkasan Pesanan ({cart.length} Item)
            </h3>

            {/* Items Breakdown */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {cart.map((item, idx) => {
                const basePrice = (item.product.sale_price && item.product.sale_price < item.product.price)
                  ? item.product.sale_price
                  : item.product.price;
                const unitPrice = basePrice + (item.variant ? item.variant.price_adjustment : 0);
                return (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF5FF] border border-[#E5DCEC] overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                      <img
                        src={getImageUrl(item.product.image)}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#35264A] truncate">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-[#7652A8]">{item.variant.variant_name}</p>
                      )}
                      <p className="text-[#746A7E] mt-0.5">
                        {item.quantity} x {formatRupiah(unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold text-[#35264A] flex-shrink-0">
                      {formatRupiah(unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cost Details */}
            <div className="pt-3 border-t border-[#E5DCEC] space-y-2 text-xs">
              <div className="flex justify-between text-[#746A7E]">
                <span>Subtotal Produk:</span>
                <span className="font-semibold text-[#35264A]">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#746A7E]">
                <span>Biaya Pengiriman:</span>
                <span className="font-semibold text-[#35264A]">
                  {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-[#746A7E]">
                <span>Diskon / Potongan:</span>
                <span className="font-semibold text-emerald-600">Rp 0</span>
              </div>
              <div className="pt-3 border-t border-[#E5DCEC] flex justify-between items-baseline">
                <span className="font-poppins font-bold text-sm text-[#35264A]">Total Tagihan:</span>
                <span className="font-poppins font-extrabold text-xl text-[#7652A8]">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <span>Konfirmasi & Buat Pesanan</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#746A7E] text-center pt-1">
              <ShieldCheckIcon className="w-4 h-4 text-[#7652A8]" />
              <span>Transaksi aman dan terenkripsi server BubLuv</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
