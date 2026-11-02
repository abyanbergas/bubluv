import React from 'react';
import { Link } from 'react-router-dom';
import {
  BubLuvLogo,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  BankBcaIcon,
  BankBriIcon,
  QrisIcon,
  EwalletIcon,
  CodIcon,
} from './SvgIcons';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { settings } = useStore();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E5DCEC] pt-16 pb-8 text-[#35264A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <BubLuvLogo className="h-10" />
            <p className="text-sm text-[#746A7E] leading-relaxed">
              {settings.store_description ||
                'BubLuv adalah produsen bubuk minuman kekinian premium dengan varian rasa terlengkap untuk usaha kafe dan konsumsi pribadi di rumah.'}
            </p>
            <p className="font-poppins font-semibold text-xs text-[#7652A8] italic">
              "A little sip, a lot of love."
            </p>

            {/* Social Media Links */}
            <div className="flex items-center space-x-3 pt-2">
              {settings.store_instagram && (
                <a
                  href={settings.store_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#E9DDFB]/50 hover:bg-[#F5A8D0] text-[#7652A8] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="Instagram BubLuv"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
              )}
              {settings.store_tiktok && (
                <a
                  href={settings.store_tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#E9DDFB]/50 hover:bg-[#F5A8D0] text-[#7652A8] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="TikTok BubLuv"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
              {settings.store_whatsapp && (
                <a
                  href={`https://wa.me/${settings.store_whatsapp.replace(/\D/g, '')}?text=Halo%20BubLuv,%20saya%20tertarik%20dengan%20produk%20bubuk%20minuman`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#E9DDFB]/50 hover:bg-[#4E9F3D] text-[#7652A8] hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="WhatsApp BubLuv"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-poppins font-bold text-base text-[#35264A]">Menu Cepat</h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#746A7E]">
              <li>
                <Link to="/" className="hover:text-[#7652A8] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#7652A8] transition-colors">
                  Katalog Belanja (Shop)
                </Link>
              </li>
              <li>
                <Link to="/#categories" className="hover:text-[#7652A8] transition-colors">
                  Kategori Varian Rasa
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#7652A8] transition-colors">
                  Tentang BubLuv
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-poppins font-bold text-base text-[#35264A]">Kontak</h4>
            <div className="space-y-3 text-sm text-[#746A7E]">
              <div className="text-xs text-[#746A7E]">
                Email: <span className="text-[#7652A8] font-semibold">{settings.store_email || 'halo@bubluv.com'}</span>
              </div>
            </div>

            {/* Payment Badges */}
            <div className="pt-2">
              <h5 className="text-xs font-bold text-[#35264A] uppercase tracking-wider mb-2">Metode Pembayaran:</h5>
              <div className="flex flex-wrap items-center gap-2">
                <BankBcaIcon className="h-5" />
                <BankBriIcon className="h-5" />
                <QrisIcon className="h-5" />
                <EwalletIcon className="h-5" />
                <CodIcon className="h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#E5DCEC] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#746A7E] gap-2">
          <p>© {currentYear} BubLuv. All rights reserved. A little sip, a lot of love.</p>
          <div className="flex space-x-4">
            <span className="hover:text-[#7652A8] cursor-pointer">Kebijakan Privasi</span>
            <span>•</span>
            <span className="hover:text-[#7652A8] cursor-pointer">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
