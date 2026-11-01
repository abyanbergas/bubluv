import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatRupiah } from '../services/api';
import { Order } from '../types';
import { CartIcon, ChevronRightIcon } from '../components/SvgIcons';
import { useAuth } from '../context/AuthContext';

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/customer/orders');
        if (res.data?.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching customer orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-[#35264A]">
          Riwayat Pesanan Saya
        </h1>
        <p className="text-xs sm:text-sm text-[#746A7E]">
          Pantau status pemrosesan dan detail riwayat belanja bubuk minuman Anda di BubLuv.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#746A7E]">
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E9DDFB]/50 flex items-center justify-center mx-auto text-[#7652A8]">
            <CartIcon className="w-8 h-8" />
          </div>
          <h3 className="font-poppins font-bold text-lg text-[#35264A]">Belum Ada Pesanan</h3>
          <p className="text-xs sm:text-sm text-[#746A7E] max-w-sm mx-auto">
            Anda belum pernah melakukan pemesanan. Yuk mulai eksplorasi varian rasa terbaik BubLuv!
          </p>
          <Link
            to="/shop"
            className="inline-block px-6 py-2.5 bg-[#7652A8] text-white font-bold text-xs rounded-xl hover:bg-[#5D3F87] transition-all"
          >
            Mulai Belanja Sekarang
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-3xl border border-[#E5DCEC] p-5 sm:p-6 shadow-xs hover:border-[#7652A8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-poppins font-extrabold text-sm text-[#35264A]">
                    {o.order_number}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[#E9DDFB] text-[#7652A8]">
                    {o.order_status}
                  </span>
                </div>
                <p className="text-xs text-[#746A7E]">
                  {new Date(o.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })} • {o.items?.length || 0} item produk
                </p>
                <p className="text-xs font-bold text-[#7652A8]">
                  Total: {formatRupiah(o.total)} ({o.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'})
                </p>
              </div>

              <Link
                to={`/orders/${o.order_number}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FAF5FF] hover:bg-[#E9DDFB] text-[#7652A8] font-bold text-xs rounded-xl border border-[#E5DCEC] transition-colors"
              >
                <span>Detail & Pelacakan</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
