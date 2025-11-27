// src/hooks/usePreferredCurrency.js
import { useState, useEffect, useCallback } from 'react';

const CURRENCY_STORAGE_KEY = 'preferred_currency';

const SUPPORTED_CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
];

export const usePreferredCurrency = () => {
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    if (typeof window === 'undefined') return SUPPORTED_CURRENCIES[0];

    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return SUPPORTED_CURRENCIES.find(c => c.code === stored) || SUPPORTED_CURRENCIES[0];
  });

  // Sync with localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CURRENCY_STORAGE_KEY) {
        const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === e.newValue) || SUPPORTED_CURRENCIES[0];
        setPreferredCurrency(newCurrency);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const changeCurrency = (code) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (currency) {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency.code);
      setPreferredCurrency(currency);
    }
  };

 

  const formatCurrency = useCallback((value) => {
    const num = Number(value);
    const abs = Math.abs(num);
  
    if (abs >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = Math.log10(abs) / 3 | 0;
      const suffix = suffixes[tier];
      const scale = Math.pow(1000, tier);
      const scaled = num / scale;
  
      return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffix}`;
    }
  
    // Below 1 million → full format with commas
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: preferredCurrency.code,
      minimumFractionDigits: 2,
    }).format(num);
  }, [preferredCurrency]);
  return {
    preferredCurrency,
    currencies: SUPPORTED_CURRENCIES,
    changeCurrency,
    formatCurrency,
  };
};


