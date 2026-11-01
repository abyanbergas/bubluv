import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BubLuvLogo } from '../components/SvgIcons';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, passwordConfirmation, phone);
    setLoading(false);

    if (res.success) {
      navigate('/shop');
    } else {
      setErrorMsg(res.message || 'Registrasi gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5DCEC] p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <BubLuvLogo className="h-10 mx-auto" />
          </Link>
          <h1 className="font-poppins font-extrabold text-2xl text-[#35264A]">
            Buat Akun Pelanggan
          </h1>
          <p className="text-xs text-[#746A7E]">
            Daftar untuk menikmati belanja mudah, simpan alamat, dan pantau status pesanan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Alamat Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Nomor WhatsApp / HP (Opsional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Kata Sandi *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#35264A]">Ulangi Kata Sandi *</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi kata sandi"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF5FF] border border-[#E5DCEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7652A8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Daftar Akun Sekarang</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#746A7E]">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="font-bold text-[#7652A8] hover:underline">
            Masuk Disini
          </Link>
        </p>
      </div>
    </div>
  );
};
