import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Category, StoreSettings } from '../types';

interface StoreContextType {
  settings: StoreSettings;
  categories: Category[];
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'BubLuv Official Store',
    store_tagline: 'A little sip, a lot of love',
    store_description: 'BubLuv adalah produsen bubuk minuman kekinian premium dengan varian rasa terlengkap untuk usaha kafe dan konsumsi pribadi di rumah.',
    store_phone: '+62 812-3456-7890',
    store_whatsapp: '6281234567890',
    store_email: 'halo@bubluv.com',
    store_address: 'Jl. Boulevard Raya Blok Q No. 12, Kelapa Gading, Jakarta Utara, DKI Jakarta 14240',
    store_instagram: 'https://instagram.com/bubluv.official',
    store_tiktok: 'https://tiktok.com/@bubluv.official',
    bank_bca_number: '8271928371',
    bank_bca_holder: 'PT BUBLUV INDONESIA SEJAHTERA',
    bank_bri_number: '012301002345501',
    bank_bri_holder: 'PT BUBLUV INDONESIA SEJAHTERA',
    enable_cod: '1',
    enable_manual_bank: '1',
    enable_payment_gateway: '1',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStoreData = async () => {
    try {
      const [settingsRes, categoriesRes] = await Promise.allSettled([
        api.get('/settings'),
        api.get('/categories'),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
        setSettings(settingsRes.value.data.data);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.success) {
        setCategories(categoriesRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  return (
    <StoreContext.Provider value={{ settings, categories, loading, refreshSettings: fetchStoreData }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
