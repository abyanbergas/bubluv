import React, { useState, useEffect } from 'react';
import api, { formatRupiah, getImageUrl } from '../../services/api';
import { Payment } from '../../types';
import { CloseIcon, CheckIcon } from '../../components/SvgIcons';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments');
      if (res.data?.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (action: 'approve' | 'reject' | 'collect_cod') => {
    if (!selectedPayment) return;
    setVerifying(true);
    setAlertMsg(null);

    try {
      const res = await api.put(`/admin/payments/${selectedPayment.id}/verify`, {
        action,
        notes: actionNotes || undefined,
      });

      if (res.data?.success) {
        setAlertMsg({ text: res.data.message, type: 'success' });
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memverifikasi pembayaran.';
      setAlertMsg({ text: msg, type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
          Verifikasi Pembayaran & Bukti Transfer
        </h1>
        <p className="text-xs text-[#746A7E]">
          Periksa keaslian bukti transfer bank manual, konfirmasi penerimaan tunai COD, dan pantau status transaksi gateway.
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

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E5DCEC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px] border-b border-[#E5DCEC]">
              <tr>
                <th className="p-3.5">ID & Waktu</th>
                <th className="p-3.5">No. Pesanan</th>
                <th className="p-3.5">Metode Pembayaran</th>
                <th className="p-3.5">Nominal</th>
                <th className="p-3.5">Bukti Transfer</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#746A7E]">
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#746A7E]">
                    Belum ada data transaksi pembayaran.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-[#35264A]">#{p.id}</p>
                      <p className="text-[10px] text-[#746A7E]">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </td>
                    <td className="p-3.5 font-bold text-[#7652A8]">
                      {p.order?.order_number || '-'}
                    </td>
                    <td className="p-3.5 font-medium text-[#35264A] uppercase text-[11px]">
                      {p.payment_method}
                    </td>
                    <td className="p-3.5 font-bold text-[#35264A]">{formatRupiah(p.amount)}</td>
                    <td className="p-3.5">
                      {p.payment_proof ? (
                        <a
                          href={getImageUrl(p.payment_proof)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7652A8] hover:underline"
                        >
                          Lihat Bukti Foto
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#746A7E]">Tidak Ada File</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.payment_status === 'pending_verification'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setActionNotes('');
                        }}
                        className="px-3 py-1.5 bg-[#E9DDFB]/60 hover:bg-[#E9DDFB] text-[#7652A8] font-bold text-xs rounded-xl"
                      >
                        Periksa & Aksi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E5DCEC] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
              <h3 className="font-poppins font-bold text-base text-[#35264A]">
                Verifikasi Pembayaran Pesanan #{selectedPayment.order?.order_number}
              </h3>
              <button onClick={() => setSelectedPayment(null)} className="p-1 text-[#746A7E]">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E5DCEC] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#746A7E]">Metode Bayar:</span>
                <span className="font-bold text-[#35264A] uppercase">{selectedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746A7E]">Nominal Tagihan:</span>
                <span className="font-extrabold text-[#7652A8] text-sm">{formatRupiah(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#746A7E]">Status Saat Ini:</span>
                <span className="font-bold uppercase text-[#35264A]">{selectedPayment.payment_status}</span>
              </div>
            </div>

            {/* Proof image preview if available */}
            {selectedPayment.payment_proof && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#35264A]">Bukti Transfer Pengguna:</label>
                <div className="max-h-60 rounded-2xl overflow-hidden border border-[#E5DCEC] bg-black/5 flex items-center justify-center">
                  <img
                    src={getImageUrl(selectedPayment.payment_proof)}
                    alt="Bukti Transfer"
                    className="max-h-60 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#35264A]">Catatan Verifikasi (Opsional)</label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Misal: Mutasi BCA tervalidasi dana masuk..."
                className="w-full px-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl"
              />
            </div>

            {/* Verification Actions */}
            <div className="pt-3 border-t border-[#E5DCEC] flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-[#FAF5FF] text-xs font-bold text-[#35264A] rounded-xl"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerify('reject')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 disabled:opacity-50"
              >
                Tolak Bukti
              </button>

              {selectedPayment.payment_method === 'cod' ? (
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleVerify('collect_cod')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {verifying ? 'Memproses...' : 'Tandai COD Diterima'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleVerify('approve')}
                  className="px-5 py-2 bg-[#7652A8] hover:bg-[#5D3F87] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {verifying ? 'Memproses...' : 'Setujui & Tandai Lunas'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
