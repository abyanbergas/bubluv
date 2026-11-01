export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  is_active: boolean;
  products_count?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  sku?: string | null;
  price_adjustment: number;
  stock: number;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  ingredients?: string | null;
  serving_suggestion?: string | null;
  price: number;
  sale_price?: number | null;
  stock: number;
  sku?: string | null;
  weight: number;
  image?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  effective_price?: number;
  category?: Category;
  variants?: ProductVariant[];
  active_variants?: ProductVariant[];
  images?: ProductImage[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  product_name: string;
  variant_name?: string | null;
  sku?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  product?: Product;
}

export interface Payment {
  id: number;
  order_id: number;
  provider: string;
  payment_method: string;
  amount: number;
  transaction_reference?: string | null;
  payment_status: 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'expired' | 'refunded';
  payment_proof?: string | null;
  paid_at?: string | null;
  created_at: string;
  order?: Order;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  changed_by: string;
  old_status?: string | null;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  user_id?: number | null;
  order_number: string;
  recipient_name: string;
  phone: string;
  shipping_address: string;
  shipping_method: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  payment_status: 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'expired' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  items?: OrderItem[];
  payments?: Payment[];
  status_histories?: OrderStatusHistory[];
  user?: User;
}

export interface StoreSettings {
  store_name?: string;
  store_tagline?: string;
  store_description?: string;
  store_phone?: string;
  store_whatsapp?: string;
  store_email?: string;
  store_address?: string;
  store_instagram?: string;
  store_tiktok?: string;
  bank_bca_number?: string;
  bank_bca_holder?: string;
  bank_bri_number?: string;
  bank_bri_holder?: string;
  enable_cod?: string;
  enable_manual_bank?: string;
  enable_payment_gateway?: string;
}
