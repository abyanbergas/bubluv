import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BubLuvLogo,
  DashboardIcon,
  ProductsIcon,
  CategoriesIcon,
  OrdersIcon,
  PaymentMethodIcon,
  CustomersIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  ChevronRightIcon,
} from './SvgIcons';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5FC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7652A8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F5FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#E5DCEC] p-8 max-w-md text-center space-y-4 shadow-xl">
          <h2 className="font-poppins font-bold text-xl text-[#35264A]">Akses Admin Dibatasi</h2>
          <p className="text-xs text-[#746A7E]">
            Area ini khusus untuk pemilik toko dan staf administrator BubLuv. Silakan login menggunakan akun berhak akses admin.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-[#7652A8] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Login Admin
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-[#FAF5FF] border border-[#E5DCEC] text-[#35264A] font-bold text-xs rounded-xl"
            >
              Kembali ke Toko
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: <DashboardIcon className="w-5 h-5" /> },
    { name: 'Kelola Produk', path: '/admin/products', icon: <ProductsIcon className="w-5 h-5" /> },
    { name: 'Kategori Varian', path: '/admin/categories', icon: <CategoriesIcon className="w-5 h-5" /> },
    { name: 'Daftar Pesanan', path: '/admin/orders', icon: <OrdersIcon className="w-5 h-5" /> },
    { name: 'Verifikasi Pembayaran', path: '/admin/payments', icon: <PaymentMethodIcon className="w-5 h-5" /> },
    { name: 'Data Pelanggan', path: '/admin/customers', icon: <CustomersIcon className="w-5 h-5" /> },
    { name: 'Pengaturan Toko', path: '/admin/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F8F5FC] flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#E5DCEC] flex-shrink-0 min-h-screen p-5 space-y-6">
        {/* Brand */}
        <div className="pb-4 border-b border-[#E5DCEC]">
          <Link to="/" className="block">
            <BubLuvLogo className="h-9" />
          </Link>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#7652A8] text-white">
            Admin Workspace
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-poppins text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#7652A8] text-white shadow-xs'
                    : 'text-[#746A7E] hover:text-[#35264A] hover:bg-[#FAF5FF]'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Admin Info */}
        <div className="pt-4 border-t border-[#E5DCEC] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7652A8] text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-poppins font-bold text-xs text-[#35264A] truncate">{user.name}</p>
              <p className="text-[10px] text-[#746A7E] truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 py-1.5 text-center bg-[#FAF5FF] hover:bg-[#E9DDFB] text-[11px] font-bold text-[#7652A8] rounded-xl border border-[#E5DCEC] transition-colors"
            >
              Lihat Toko
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
              title="Logout"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E5DCEC] h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#35264A] hover:bg-[#FAF5FF] rounded-xl"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h2 className="font-poppins font-bold text-sm sm:text-base text-[#35264A]">
              Panel Operasional Toko
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-bold text-[#7652A8] hover:underline hidden sm:inline"
            >
              Buka Website Pelanggan ↗
            </Link>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Server MySQL Online
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div className="fixed inset-y-0 left-0 w-64 bg-white p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5DCEC]">
                <BubLuvLogo className="h-8" />
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-[#746A7E]">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-poppins text-xs font-bold ${
                      isActive(item.path)
                        ? 'bg-[#7652A8] text-white'
                        : 'text-[#746A7E] hover:bg-[#FAF5FF]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E5DCEC] space-y-2">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="block text-center py-2 bg-[#FAF5FF] text-xs font-bold text-[#7652A8] rounded-xl"
              >
                Kembali ke Toko
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-2 bg-red-50 text-xs font-bold text-red-600 rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
