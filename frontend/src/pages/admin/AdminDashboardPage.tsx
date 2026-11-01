import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatRupiah } from '../../services/api';
import {
  ProductsIcon,
  CategoriesIcon,
  OrdersIcon,
  PaymentMethodIcon,
  CustomersIcon,
  ChevronRightIcon,
} from '../../components/SvgIcons';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<{
    total_products: number;
    total_categories: number;
    new_orders: number;
    processing_orders: number;
    total_sales: number;
    total_customers: number;
    low_stock_products: any[];
    recent_orders: any[];
    monthly_sales: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Gagal memuat data dashboard.');
      }
    } catch (err: any) {
      console.error('Error fetching admin dashboard metrics:', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Sesi admin tidak valid atau akses ditolak. Silakan login ulang.');
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#7652A8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#746A7E]">Memuat ringkasan performa toko...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-8 max-w-md mx-auto shadow-xs space-y-3">
          <h2 className="font-poppins font-bold text-lg text-[#35264A]">Gagal Memuat Dashboard</h2>
          <p className="text-xs text-[#746A7E]">{error || 'Data dashboard tidak tersedia.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-5 py-2.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Penjualan Lunas', value: formatRupiah(data.total_sales), icon: <PaymentMethodIcon className="w-6 h-6 text-[#7652A8]" />, bg: 'bg-[#E9DDFB]/50' },
    { title: 'Pesanan Baru (Pending)', value: data.new_orders, icon: <OrdersIcon className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-50' },
    { title: 'Pesanan Diproses', value: data.processing_orders, icon: <OrdersIcon className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' },
    { title: 'Produk Aktif', value: data.total_products, icon: <ProductsIcon className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
    { title: 'Total Kategori', value: data.total_categories, icon: <CategoriesIcon className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-50' },
    { title: 'Total Pelanggan', value: data.total_customers, icon: <CustomersIcon className="w-6 h-6 text-pink-600" />, bg: 'bg-pink-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A]">
          Ringkasan Statistik Toko
        </h1>
        <p className="text-xs sm:text-sm text-[#746A7E] mt-1">
          Pantau metrik penjualan riil, status operasional gudang, dan pesanan terbaru pelanggan.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-[#E5DCEC] p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-[#746A7E]">{card.title}</p>
              <h3 className="font-poppins font-extrabold text-xl sm:text-2xl text-[#35264A] mt-1">
                {card.value}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Sales Chart & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart / Volume Overview */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5DCEC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
            <h3 className="font-poppins font-bold text-base text-[#35264A]">
              Grafik Penjualan Bulanan
            </h3>
            <span className="text-xs text-[#746A7E]">Transaksi Sukses</span>
          </div>

          {data.monthly_sales.length > 0 ? (
            <div className="h-64 flex items-end gap-6 pt-6 pb-2 px-4">
              {data.monthly_sales.map((item, idx) => {
                const maxRev = Math.max(...data.monthly_sales.map((m: any) => m.revenue || 1));
                const heightPercent = Math.max(15, Math.round((item.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-[#7652A8]">
                      {formatRupiah(item.revenue)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-[#7652A8] to-[#F5A8D0] rounded-xl transition-all duration-500 shadow-xs"
                    />
                    <span className="text-[11px] font-semibold text-[#746A7E]">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-[#746A7E]">
              Belum ada riwayat transaksi penjualan terverifikasi bulan ini.
            </div>
          )}
        </div>

        {/* Low Stock Warning */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5DCEC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
            <div>
              <h3 className="font-poppins font-bold text-base text-[#35264A]">
                Peringatan Stok Menipis
              </h3>
              <span className="text-[11px] text-[#746A7E]">Sisa stok ≤ 20 unit</span>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-[#7652A8] hover:underline"
            >
              Kelola Produk
            </Link>
          </div>

          <div className="space-y-3">
            {data.low_stock_products.length > 0 ? (
              data.low_stock_products.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#35264A] truncate">{p.name}</p>
                    <p className="text-[10px] text-[#746A7E]">SKU: {p.sku || '-'}</p>
                  </div>
                  <span className="font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0">
                    Sisa {p.stock} pcs
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-2xl border border-emerald-200">
                ✓ Seluruh stok produk dalam kondisi aman (&gt; 20 unit).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
          <h3 className="font-poppins font-bold text-base text-[#35264A]">
            Pesanan Masuk Terbaru
          </h3>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[#7652A8] hover:underline flex items-center gap-1"
          >
            <span>Semua Pesanan</span>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">No. Pesanan</th>
                <th className="p-3">Penerima</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Metode Bayar</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status Pesanan</th>
                <th className="p-3 rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {data.recent_orders.length > 0 ? (
                data.recent_orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3 font-bold text-[#7652A8]">{o.order_number}</td>
                    <td className="p-3 font-medium text-[#35264A]">{o.recipient_name}</td>
                    <td className="p-3 text-[#746A7E]">
                      {new Date(o.created_at).toLocaleDateString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 uppercase text-[11px] font-semibold">{o.payment_method}</td>
                    <td className="p-3 font-bold text-[#35264A]">{formatRupiah(o.total)}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E9DDFB] text-[#7652A8]">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/admin/orders?search=${o.order_number}`}
                        className="text-[#7652A8] hover:underline font-bold"
                      >
                        Periksa
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#746A7E]">
                    Belum ada pesanan terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
