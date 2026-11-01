import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BubLuvLogo,
  SearchIcon,
  CartIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
  LogoutIcon,
  DashboardIcon,
} from './SvgIcons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5DCEC] shadow-xs transition-all">
      {/* Top Banner */}
      <div className="bg-[#7652A8] text-white text-xs font-medium py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="bg-[#F5A8D0] text-[#35264A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Promo Kekinian
          </span>
          <span>{settings.store_tagline || 'A little sip, a lot of love'} — Siap Kirim ke Seluruh Indonesia!</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <BubLuvLogo className="h-11" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-poppins text-sm font-semibold px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-[#7652A8] bg-[#E9DDFB]/60'
                    : 'text-[#35264A] hover:text-[#7652A8] hover:bg-[#E9DDFB]/30'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bubuk minuman favoritmu..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#E9DDFB]/30 border border-[#E5DCEC] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7652A8] focus:bg-white text-[#35264A] placeholder-[#746A7E] transition-all"
            />
            <div className="absolute left-3.5 text-[#746A7E]">
              <SearchIcon className="w-4 h-4" />
            </div>
          </form>

          {/* Right Actions: Cart & Account */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-2xl bg-[#E9DDFB]/40 hover:bg-[#E9DDFB] text-[#7652A8] transition-all duration-200 hover:scale-105"
              aria-label="Keranjang Belanja"
            >
              <CartIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5A8D0] text-[#35264A] text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-[#E9DDFB]/40 hover:bg-[#E9DDFB] text-[#35264A] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[#7652A8] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E5DCEC] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#E5DCEC]">
                      <p className="text-xs text-[#746A7E]">Masuk sebagai</p>
                      <p className="text-sm font-bold text-[#35264A] truncate">{user.name}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#E9DDFB] text-[#7652A8]">
                        {user.role}
                      </span>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#7652A8] font-bold hover:bg-[#E9DDFB]/40 transition-colors"
                      >
                        <DashboardIcon className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#35264A] hover:bg-[#E9DDFB]/40 transition-colors"
                    >
                      <CartIcon className="w-4 h-4" />
                      Riwayat Pesanan
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#7652A8] bg-[#E9DDFB]/50 hover:bg-[#E9DDFB] rounded-xl transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#7652A8] hover:bg-[#5D3F87] rounded-xl shadow-xs hover:shadow-md transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#35264A] hover:bg-[#E9DDFB]/40"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5DCEC] px-4 pt-2 pb-6 space-y-3">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rasa favoritmu..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#E9DDFB]/30 border border-[#E5DCEC] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
            <div className="absolute left-3.5 top-2.5 text-[#746A7E]">
              <SearchIcon className="w-4 h-4" />
            </div>
          </form>

          <nav className="flex flex-col space-y-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-poppins text-sm font-semibold px-3 py-2 rounded-xl ${
                  isActive(link.path)
                    ? 'text-[#7652A8] bg-[#E9DDFB]/60'
                    : 'text-[#35264A] hover:bg-[#E9DDFB]/20'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!user && (
              <div className="pt-3 border-t border-[#E5DCEC] flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-[#7652A8] bg-[#E9DDFB] rounded-xl"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-[#7652A8] rounded-xl"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
