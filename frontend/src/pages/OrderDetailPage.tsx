import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatRupiah, getImageUrl } from '../services/api';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';
import {
  CheckIcon,
  ShieldCheckIcon,
  BankBcaIcon,
  BankBriIcon,
  QrisIcon,
  TruckIcon,
  ChevronRightIcon,
} from '../components/SvgIcons';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { settings } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderNumber}`);
      if (res.data?.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return;

    setUploading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('payment_proof', proofFile);

    try {
      const res = await api.post(`/orders/${orderNumber}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setMsg({ text: res.data.message || 'Bukti transfer berhasil diunggah.', type: 'success' });
        fetchOrder();
      }
    } catch (err: any) {
      const m = err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.';
      setMsg({ text: m, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSimulatePayment = async (status: 'settlement' | 'failed') => {
    setSimulating(true);
    setMsg(null);
    try {
      const res = await api.post('/payments/simulate-sandbox', {
        order_number: orderNumber,
        status,
        transaction_reference: `SIM-${Date.now()}`,
      });

      if (res.data?.success) {
        setMsg({ text: res.data.message, type: 'success' });
        fetchOrder();
      }
    } catch (err: any) {
      setMsg({ text: 'Gagal memproses simulasi gateway.', type: 'error' });
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string, bank: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#7652A8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#746A7E]">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-poppins font-bold text-2xl text-[#35264A]">Pesanan Tidak Ditemukan</h2>
        <p className="text-sm text-[#746A7E]">Nomor pesanan yang Anda tuju tidak valid atau tidak terdaftar.</p>
        <Link to="/" className="inline-block px-6 py-2.5 bg-[#7652A8] text-white font-bold text-sm rounded-xl">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Terkonfirmasi</span>;
      case 'processing':
        return <span className="bg-purple-100 text-[#7652A8] px-3 py-1 rounded-full text-xs font-bold">Sedang Diproses</span>;
      case 'shipped':
        return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">Dalam Pengiriman</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Pesanan Selesai</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Dibatalkan</span>;
      case 'pending':
      default:
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Menunggu Pembayaran</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Lunas (Paid)</span>;
      case 'pending_verification':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Menunggu Verifikasi Admin</span>;
      case 'failed':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Gagal / Ditolak</span>;
      case 'unpaid':
      default:
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Belum Dibayar</span>;
    }
  };

  const isManual = order.payment_method === 'manual_transfer';
  const isGateway = order.payment_method.startsWith('gateway_');
  const isCod = order.payment_method === 'cod';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DCEC]">
          <div>
            <span className="text-xs font-semibold text-[#746A7E]">Nomor Pesanan</span>
            <h1 className="font-poppins font-extrabold text-2xl text-[#35264A] tracking-tight">
              {order.order_number}
            </h1>
            <p className="text-xs text-[#746A7E] mt-1">
              Dibuat pada {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <span className="text-[10px] text-[#746A7E] block mb-0.5 font-bold uppercase">Status Pesanan:</span>
              {getOrderStatusBadge(order.order_status)}
            </div>
            <div>
              <span className="text-[10px] text-[#746A7E] block mb-0.5 font-bold uppercase">Status Pembayaran:</span>
              {getPaymentStatusBadge(order.payment_status)}
            </div>
          </div>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Instructions & Proof Upload */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Instructions Card */}
          {order.payment_status !== 'paid' && (
            <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-5 shadow-xs">
              <h3 className="font-poppins font-bold text-base text-[#35264A] flex items-center gap-2">
                <span>Instruksi Pembayaran</span>
              </h3>

              {/* Total to Pay Highlight */}
              <div className="p-4 rounded-2xl bg-[#E9DDFB]/40 border border-[#E5DCEC] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#746A7E] font-medium">Nominal yang Harus Dibayar:</span>
                  <p className="font-poppins font-extrabold text-2xl text-[#7652A8]">
                    {formatRupiah(order.total)}
                  </p>
                </div>
                <span className="text-[11px] bg-white text-[#7652A8] font-bold px-3 py-1 rounded-full border border-[#E5DCEC]">
                  Tepat Sesuai Total
                </span>
              </div>

              {/* 1. Manual Bank Transfer Instructions */}
              {isManual && (
                <div className="space-y-4">
                  <p className="text-xs text-[#746A7E]">
                    Silakan transfer pembayaran ke salah satu rekening bank resmi BubLuv berikut:
                  </p>

                  {/* Bank BCA */}
                  <div className="p-4 rounded-2xl border border-[#E5DCEC] bg-[#FAF5FF] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BankBcaIcon className="h-6" />
                      <div>
                        <p className="font-poppins font-bold text-sm text-[#35264A]">
                          {settings.bank_bca_number || '8271928371'}
                        </p>
                        <p className="text-[11px] text-[#746A7E]">
                          a.n {settings.bank_bca_holder || 'PT BUBLUV INDONESIA SEJAHTERA'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(settings.bank_bca_number || '8271928371', 'BCA')}
                      className="px-3 py-1.5 text-xs font-bold text-[#7652A8] bg-white border border-[#E5DCEC] hover:bg-[#E9DDFB] rounded-xl transition-colors"
                    >
                      {copiedBank === 'BCA' ? 'Tersalin!' : 'Salin No. Rek'}
                    </button>
                  </div>

                  {/* Bank BRI */}
                  <div className="p-4 rounded-2xl border border-[#E5DCEC] bg-[#FAF5FF] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BankBriIcon className="h-6" />
                      <div>
                        <p className="font-poppins font-bold text-sm text-[#35264A]">
                          {settings.bank_bri_number || '012301002345501'}
                        </p>
                        <p className="text-[11px] text-[#746A7E]">
                          a.n {settings.bank_bri_holder || 'PT BUBLUV INDONESIA SEJAHTERA'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(settings.bank_bri_number || '012301002345501', 'BRI')}
                      className="px-3 py-1.5 text-xs font-bold text-[#7652A8] bg-white border border-[#E5DCEC] hover:bg-[#E9DDFB] rounded-xl transition-colors"
                    >
                      {copiedBank === 'BRI' ? 'Tersalin!' : 'Salin No. Rek'}
                    </button>
                  </div>

                  {/* Upload Payment Proof Form */}
                  <form onSubmit={handleUploadProof} className="pt-4 border-t border-[#E5DCEC] space-y-3">
                    <label className="text-xs font-bold text-[#35264A] block">
                      Unggah Bukti Transfer Bank (Screenshot / Foto Struk)
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleProofChange}
                        className="text-xs text-[#746A7E] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E9DDFB] file:text-[#7652A8] hover:file:bg-[#D8B4F8] cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={!proofFile || uploading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                      >
                        {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                      </button>
                    </div>

                    {proofPreview && (
                      <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border border-[#E5DCEC] relative">
                        <img src={proofPreview} alt="Preview Bukti" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* 2. QRIS Simulation / Gateway */}
              {isGateway && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] text-center space-y-3">
                    <div className="inline-flex p-3 bg-white rounded-2xl border border-[#E5DCEC] shadow-sm">
                      <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Realistic Mock QR Pattern */}
                        <rect width="100" height="100" fill="#FFFFFF"/>
                        <rect x="10" y="10" width="24" height="24" fill="#35264A"/>
                        <rect x="14" y="14" width="16" height="16" fill="#FFFFFF"/>
                        <rect x="18" y="18" width="8" height="8" fill="#35264A"/>
                        <rect x="66" y="10" width="24" height="24" fill="#35264A"/>
                        <rect x="70" y="14" width="16" height="16" fill="#FFFFFF"/>
                        <rect x="74" y="18" width="8" height="8" fill="#35264A"/>
                        <rect x="10" y="66" width="24" height="24" fill="#35264A"/>
                        <rect x="14" y="70" width="16" height="16" fill="#FFFFFF"/>
                        <rect x="18" y="74" width="8" height="8" fill="#35264A"/>
                        <circle cx="50" cy="50" r="10" fill="#7652A8"/>
                        <path d="M40 20 H60 M20 40 H80 M40 60 H60 M40 80 H60" stroke="#35264A" strokeWidth="4" strokeDasharray="4 4"/>
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#35264A]">
                      Scan QRIS Menggunakan Aplikasi Mobile Banking / E-Wallet Anda
                    </p>
                    <p className="text-[11px] text-[#746A7E]">
                      QRIS Nasional mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja.
                    </p>
                  </div>

                  {/* Sandbox Gateway Testing Simulator (as required by Section 8.5 & 16) */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                      Mode Pengujian Payment Gateway Sandbox
                    </span>
                    <p className="text-xs text-amber-900">
                      Anda dapat mensimulasikan respons pembayaran sukses atau gagal dari Payment Gateway secara instan:
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSimulatePayment('settlement')}
                        disabled={simulating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                      >
                        {simulating ? 'Memproses...' : 'Simulasi Pembayaran Sukses (Settlement)'}
                      </button>
                      <button
                        onClick={() => handleSimulatePayment('failed')}
                        disabled={simulating}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                      >
                        Simulasi Gagal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. COD Instructions */}
              {isCod && (
                <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#35264A]">
                    <TruckIcon className="w-4 h-4 text-[#7652A8]" />
                    <span>Metode Pembayaran di Tempat (COD)</span>
                  </div>
                  <p className="text-xs text-[#746A7E] leading-relaxed">
                    Siapkan uang tunai pas sebesar <strong>{formatRupiah(order.total)}</strong> saat kurir mengantarkan paket pesanan bubuk minuman BubLuv ke alamat Anda.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* If already Paid */}
          {order.payment_status === 'paid' && (
            <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-poppins font-bold text-base">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
                <span>Pembayaran Telah Diverifikasi & Lunas!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Terima kasih! Pembayaran Anda sebesar <strong>{formatRupiah(order.total)}</strong> telah terkonfirmasi. Tim produksi kami sedang mempersiapkan paket bubuk minuman dengan standar higienis terbaik.
              </p>
            </div>
          )}

          {/* Status Timeline History */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4 shadow-xs">
            <h3 className="font-poppins font-bold text-base text-[#35264A]">
              Riwayat & Jejak Pemrosesan Pesanan
            </h3>

            <div className="relative pl-6 space-y-4 border-l-2 border-[#E9DDFB]">
              {order.status_histories && order.status_histories.length > 0 ? (
                order.status_histories.map((hist, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#7652A8] border-2 border-white ring-2 ring-[#E9DDFB]" />
                    <p className="text-xs font-bold text-[#35264A]">
                      Status: <span className="uppercase text-[#7652A8]">{hist.new_status}</span>
                    </p>
                    <p className="text-[11px] text-[#746A7E] mt-0.5">{hist.notes || '-'}</p>
                    <span className="text-[10px] text-[#746A7E]/70 block mt-1">
                      {new Date(hist.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#746A7E]">Pesanan baru dibuat dan menunggu konfirmasi.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Items & Shipping Address Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shipping Info Card */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-3 shadow-xs">
            <h3 className="font-poppins font-bold text-sm text-[#35264A]">
              Tujuan Pengiriman
            </h3>
            <div className="text-xs space-y-1.5 text-[#746A7E]">
              <p className="font-bold text-[#35264A] text-sm">{order.recipient_name}</p>
              <p>Nomor HP: {order.phone}</p>
              <p className="leading-relaxed whitespace-pre-line">{order.shipping_address}</p>
              <div className="pt-2 border-t border-[#E5DCEC]/60 flex items-center justify-between text-[#35264A]">
                <span className="font-semibold">Layanan Kurir:</span>
                <span className="font-bold text-[#7652A8]">{order.shipping_method}</span>
              </div>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 space-y-4 shadow-xs">
            <h3 className="font-poppins font-bold text-sm text-[#35264A] pb-2 border-b border-[#E5DCEC]">
              Daftar Produk yang Dipesan
            </h3>

            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs pb-3 border-b border-[#E5DCEC]/50 last:border-b-0 last:pb-0">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF5FF] border border-[#E5DCEC] overflow-hidden flex-shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={getImageUrl(item.product?.image)}
                      alt={item.product_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#35264A] truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-[10px] text-[#7652A8]">{item.variant_name}</p>
                    )}
                    <p className="text-[#746A7E] mt-0.5">
                      {item.quantity} x {formatRupiah(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-bold text-[#35264A] flex-shrink-0">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-[#E5DCEC] space-y-1.5 text-xs text-[#746A7E]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#35264A]">{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span className="font-semibold text-[#35264A]">{formatRupiah(order.shipping_cost)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E5DCEC] flex justify-between items-baseline font-bold">
                <span className="text-[#35264A] font-poppins text-sm">Total Tagihan:</span>
                <span className="font-poppins font-extrabold text-lg text-[#7652A8]">
                  {formatRupiah(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
