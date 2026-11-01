import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bubluv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('bubluv_token')) {
        localStorage.removeItem('bubluv_token');
        localStorage.removeItem('bubluv_user');
      }
    }
    return Promise.reject(error);
  }
);

export function getImageUrl(path?: string | null): string {
  if (!path || path.trim() === '') return '/logo.svg'; // placeholder sampai gambar tersedia
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/')) return `${STORAGE_URL}${path}`;
  if (path.startsWith('/images/')) return path; // Served directly from frontend public
  return `${STORAGE_URL}/storage/${path.replace(/^\/+/, '')}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default api;
