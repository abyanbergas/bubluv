import React, { useState, useEffect } from 'react';
import api, { formatRupiah } from '../../services/api';
import { User } from '../../types';
import { SearchIcon, CustomersIcon } from '../../components/SvgIcons';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<(User & { orders_count?: number; orders_sum_total?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;

      const res = await api.get('/admin/customers', { params });
      if (res.data?.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
          Direktori Data Pelanggan
        </h1>
        <p className="text-xs text-[#746A7E]">
          Informasi pelanggan terdaftar, kontak yang dapat dihubungi, dan rekapitulasi riwayat transaksi belanja.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DCEC] p-4 flex items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau telepon pelanggan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
          />
          <SearchIcon className="w-4 h-4 text-[#746A7E] absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5DCEC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5FF] text-[#35264A] font-bold uppercase text-[10px] border-b border-[#E5DCEC]">
              <tr>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">WhatsApp / No. HP</th>
                <th className="p-3.5">Total Pesanan</th>
                <th className="p-3.5">Total Belanja Lunas</th>
                <th className="p-3.5 text-right">Status Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCEC]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#746A7E]">
                    Memuat data pelanggan...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#746A7E]">
                    Belum ada data pelanggan yang cocok.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF5FF]/50 transition-colors">
                    <td className="p-3.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#E9DDFB] text-[#7652A8] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#35264A]">{c.name}</span>
                    </td>
                    <td className="p-3.5 text-[#746A7E]">{c.email}</td>
                    <td className="p-3.5 font-medium text-[#35264A]">{c.phone || '-'}</td>
                    <td className="p-3.5 font-semibold text-[#7652A8]">
                      {c.orders_count || 0} Kali Transaksi
                    </td>
                    <td className="p-3.5 font-bold text-[#35264A]">
                      {formatRupiah(c.orders_sum_total || 0)}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-100 text-[#7652A8]">
                        Customer
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
