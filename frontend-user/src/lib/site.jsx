import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const fallback = {
  settings: {
    shop_name: 'City Florist',
    whatsapp_number: '',
    shop_phone: '',
    address: 'Hubballi, Karnataka',
    hours: 'Open daily · 8:00 AM – 10:00 PM',
    map_embed: 'https://www.google.com/maps?q=Hubballi,Karnataka&output=embed',
    hero_title: 'Crafted in petals. Delivered with love.',
    hero_subtitle:
      'Fresh flower bouquets, chocolate bouquets, car & wedding-night decoration and bridal garlands — handmade in Hubballi.',
  },
  categories: [],
  offers: [],
  featured: [],
};

const SiteContext = createContext({ ...fallback, loading: true });

export function SiteProvider({ children }) {
  const [state, setState] = useState({ ...fallback, loading: true });

  useEffect(() => {
    api
      .site()
      .then((data) => setState({ ...fallback, ...data, settings: { ...fallback.settings, ...data.settings }, loading: false }))
      .catch(() => setState((s) => ({ ...s, loading: false, error: true })));
  }, []);

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
