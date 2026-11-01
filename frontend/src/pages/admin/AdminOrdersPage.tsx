import React, { useState, useEffect } from 'react';
import api, { formatRupiah } from '../../services/api';
import { Order } from '../../types';
import { SearchIcon, CloseIcon } from '../../components/SvgIcons';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Detail & Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (orderStatus) params.order_status = orderStatus;
      if (paymentStatus) params.payment_status = paymentStatus;

      const res = await api.get('/admin/orders', { params });
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, orderStatus, paymentStatus]);

  const openOrderDetail = async (id: number) => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      if (res.data?.success) {
        setSelectedOrder(res.data.data);
        setNewStatus(res.data.data.order_status);
        setStatusNotes('');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await api.put(`/admin/orders/${selectedOrder.id}/status`, {
        order_status: newStatus,
        notes: statusNotes || undefined,
      });

      if (res.data?.success) {
        setAlertMsg({ text: res.data.message, type: 'success' });
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memperbarui status pesanan.';
      setAlertMsg({ text: msg, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
          Manajemen Pesanan Pelanggan
        </h1>
        <p className="text-xs text-[#746A7E]">
          Pantau daftar transaksi, verifikasi rincian pesanan, dan perbarui tahapan status pengiriman barang.
        </p>
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

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5DCEC] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. pesanan atau nama..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
          />
          <SearchIcon className="w-4 h-4 text-[#746A7E] absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="px-3 py-2 bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl text-xs font-semibold text-[#35264A]"
          >
            <option value="">Semua Status Pesanan</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl text-xs font-semibold text-[#35264A]"
          >
            <option value="">Semua Status Bayar</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="paid">Paid (Lunas)</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px] border-b border-[#E5DCEC]">
              <tr>
                <th className="p-3.5">No. Pesanan</th>
                <th className="p-3.5">Penerima</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">Total Tagihan</th>
                <th className="p-3.5">Status Pembayaran</th>
                <th className="p-3.5">Status Pesanan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#746A7E]">
                    Memuat pesanan...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#746A7E]">
                    Tidak ada transaksi pesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[#7652A8]">{o.order_number}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-[#35264A]">{o.recipient_name}</p>
                      <p className="text-[10px] text-[#746A7E]">{o.phone}</p>
                    </td>
                    <td className="p-3.5 text-[#746A7E]">
                      {new Date(o.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                    </td>
                    <td className="p-3.5 uppercase text-[10px] font-semibold">{o.payment_method}</td>
                    <td className="p-3.5 font-bold text-[#35264A]">{formatRupiah(o.total)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.payment_status === 'pending_verification'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E9DDFB] text-[#7652A8]">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openOrderDetail(o.id)}
                        className="px-3 py-1.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-bold rounded-xl text-xs shadow-xs"
                      >
                        Detail & Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAIL & STATUS UPDATE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
              <div>
                <span className="text-xs text-[#746A7E]">Rincian Transaksi</span>
                <h3 className="font-poppins font-bold text-lg text-[#35264A]">
                  Pesanan #{selectedOrder.order_number}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-[#746A7E]">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] text-xs">
              <div>
                <p className="font-bold text-[#35264A] text-sm">{selectedOrder.recipient_name}</p>
                <p className="text-[#746A7E] mt-0.5">Telepon: {selectedOrder.phone}</p>
                <p className="text-[#746A7E] mt-1 whitespace-pre-line">{selectedOrder.shipping_address}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[#746A7E]">Metode Kirim: <strong className="text-[#35264A]">{selectedOrder.shipping_method}</strong></p>
                <p className="text-[#746A7E]">Metode Bayar: <strong className="text-[#35264A] uppercase">{selectedOrder.payment_method}</strong></p>
                <p className="text-[#746A7E]">Status Bayar: <strong className="text-emerald-700 uppercase">{selectedOrder.payment_status}</strong></p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#35264A] uppercase tracking-wider">Item Dipesan:</h4>
              <div className="space-y-2 border border-[#E5DCEC] rounded-2xl p-3 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs py-1 border-b border-[#E5DCEC]/40 last:border-b-0">
                    <div>
                      <p className="font-bold text-[#35264A]">{item.product_name}</p>
                      {item.variant_name && <p className="text-[10px] text-[#7652A8]">{item.variant_name}</p>}
                      <p className="text-[#746A7E]">{item.quantity} x {formatRupiah(item.unit_price)}</p>
                    </div>
                    <span className="font-bold text-[#35264A]">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-[#35264A] pt-1">
                <span>Total Pembayaran:</span>
                <span className="text-[#7652A8] font-extrabold text-sm">{formatRupiah(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-[#E5DCEC] space-y-4">
              <h4 className="font-bold text-xs text-[#35264A] uppercase tracking-wider">
                Perbarui Status Pesanan
              </h4>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Status Baru *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl font-bold text-[#35264A]"
                >
                  <option value="pending">Pending (Menunggu Pembayaran)</option>
                  <option value="confirmed">Confirmed (Terkonfirmasi)</option>
                  <option value="processing">Processing (Sedang Disiapkan di Gudang)</option>
                  <option value="shipped">Shipped (Sedang Dikirim oleh Kurir)</option>
                  <option value="completed">Completed (Pesanan Selesai Diterima)</option>
                  <option value="cancelled">Cancelled (Batalkan Pesanan & Pulihkan Stok)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#35264A]">Catatan Perubahan (Audit Log)</label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Misal: Paket diserahkan ke kurir JNE resi JNE1234567..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-[#FAF5FF] text-xs font-bold text-[#35264A] rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#7652A8] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
