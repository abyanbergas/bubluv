import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bubluv_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('bubluv_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, variant?: ProductVariant | null, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          ((!item.variant && !variant) || item.variant?.id === variant?.id)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        const maxStock = variant ? variant.stock : product.stock;
        next[existingIndex].quantity = Math.min(newQty, maxStock);
        return next;
      }

      return [...prev, { product, variant: variant || null, quantity }];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (index: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }

      const next = [...prev];
      const item = next[index];
      const maxStock = item.variant ? item.variant.stock : item.product.stock;
      item.quantity = Math.min(quantity, maxStock);
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => {
    const basePrice = (item.product.sale_price && item.product.sale_price < item.product.price)
      ? item.product.sale_price
      : item.product.price;
    const variantAdjustment = item.variant ? item.variant.price_adjustment : 0;
    return sum + (basePrice + variantAdjustment) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
