import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloseIcon, TrashIcon, PlusIcon, MinusIcon, CartIcon } from './SvgIcons';
import { useCart } from '../context/CartContext';
import { formatRupiah, getImageUrl } from '../services/api';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#E5DCEC] flex items-center justify-between bg-[#FAF5FF]">
            <div className="flex items-center gap-2">
              <CartIcon className="w-5 h-5 text-[#7652A8]" />
              <h3 className="font-poppins font-bold text-lg text-[#35264A]">
                Keranjang Belanja ({totalItems})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-[#746A7E] hover:text-[#35264A] hover:bg-[#E9DDFB]/50 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-[#E9DDFB]/50 flex items-center justify-center text-[#7652A8] mb-4">
                  <CartIcon className="w-10 h-10" />
                </div>
                <h4 className="font-poppins font-bold text-lg text-[#35264A] mb-1">
                  Keranjangmu Masih Kosong
                </h4>
                <p className="text-sm text-[#746A7E] mb-6 max-w-xs">
                  Yuk, pilih varian rasa bubuk minuman kekinian favoritmu sekarang!
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="px-6 py-2.5 bg-[#7652A8] text-white font-poppins font-bold text-sm rounded-xl shadow-md hover:bg-[#5D3F87] transition-all"
                >
                  Mulai Belanja
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const basePrice = (item.product.sale_price && item.product.sale_price < item.product.price)
                  ? item.product.sale_price
                  : item.product.price;
                const unitPrice = basePrice + (item.variant ? item.variant.price_adjustment : 0);
                const itemTotal = unitPrice * item.quantity;
                const maxStock = item.variant ? item.variant.stock : item.product.stock;

                return (
                  <div
                    key={`${item.product.id}-${item.variant?.id || 'none'}`}
                    className="flex gap-3.5 p-3.5 rounded-2xl border border-[#E5DCEC] bg-[#FAF5FF]/30 hover:bg-[#FAF5FF] transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-18 h-18 rounded-xl bg-white border border-[#E5DCEC] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      <img
                        src={getImageUrl(item.product.image)}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-poppins font-bold text-xs text-[#35264A] line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="text-[#746A7E] hover:text-red-500 p-1"
                            title="Hapus"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.variant && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-[#7652A8] bg-[#E9DDFB]/60 px-2 py-0.5 rounded-md">
                            {item.variant.variant_name}
                          </span>
                        )}
                        <p className="text-xs font-extrabold text-[#7652A8] mt-1">
                          {formatRupiah(unitPrice)}
                        </p>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5DCEC]/60">
                        <div className="flex items-center border border-[#E5DCEC] rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => updateQuantity(idx, item.quantity - 1)}
                            className="p-1 hover:bg-[#E9DDFB]/40 text-[#35264A]"
                            aria-label="Kurang"
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-[#35264A]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, item.quantity + 1)}
                            disabled={item.quantity >= maxStock}
                            className="p-1 hover:bg-[#E9DDFB]/40 text-[#35264A] disabled:opacity-30"
                            aria-label="Tambah"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-[#35264A]">
                          {formatRupiah(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#E5DCEC] bg-[#FAF5FF] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#746A7E] font-medium">Subtotal Belanja:</span>
                <span className="font-poppins font-extrabold text-lg text-[#35264A]">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-[#746A7E]">
                * Ongkos kirim akan dihitung saat pengisian alamat pada halaman checkout.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full py-3.5 bg-[#7652A8] hover:bg-[#5D3F87] text-white font-poppins font-bold text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <span>Lanjut ke Pembayaran</span>
                <CartIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
