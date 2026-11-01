import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AdminLayout } from './components/AdminLayout';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Public Customer Layout Wrapper
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#E9DDFB]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <Routes>
              {/* Customer Public Routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders/:orderNumber" element={<OrderDetailPage />} />
                <Route path="/account/orders" element={<CustomerOrdersPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
