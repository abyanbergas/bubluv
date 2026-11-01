import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BubLuvLogo, UserIcon } from '../components/SvgIcons';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.message || 'Email atau kata sandi tidak sesuai.');
    }
  };

  const handleDemoFill = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@bubluv.com');
      setPassword('password');
    } else {
      setEmail('customer@bubluv.com');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5DCEC] p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <BubLuvLogo className="h-10 mx-auto" />
          </Link>
          <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
            Selamat Datang Kembali
          </h1>
          <p className="text-xs text-[#746A7E]">
            Masuk ke akun BubLuv Anda untuk memesan dan melacak pengiriman.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Demo Fast Login Shortcuts */}
        <div className="p-3.5 bg-[#FAF5FF] rounded-2xl border border-[#E5DCEC] space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-[#7652A8] tracking-wider block">
            Akses Cepat Akun Demo (Evaluation):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('customer')}
              className="px-2.5 py-1.5 bg-white border border-[#E5DCEC] hover:bg-[#E9DDFB] text-[11px] font-bold text-[#35264A] rounded-xl transition-colors text-center"
            >
              Akun Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="px-2.5 py-1.5 bg-white border border-[#E5DCEC] hover:bg-[#E9DDFB] text-[11px] font-bold text-[#7652A8] rounded-xl transition-colors text-center"
            >
              Akun Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Alamat Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Masuk Akun</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#746A7E]">
          Belum memiliki akun?{' '}
          <Link to="/register" className="font-bold text-[#7652A8] hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};
