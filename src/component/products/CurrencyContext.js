// src/context/CurrencyContext.js (or wherever your CurrencyProvider is located)

import React, { useState, useEffect, useCallback, useContext } from 'react';

const CURRENCY_STORAGE_KEY = 'preferred_currency';

// Define available currencies (ensure this is accessible/imported)
const SUPPORTED_CURRENCIES = [
  { code: 'NGN', symbol: '₦' }, 
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

const CurrencyContext = React.createContext();

// --- FIX APPLIED HERE ---
const getInitialCurrency = () => {
  if (typeof window !== 'undefined') {
    // 1. Retrieve the RAW string value from localStorage. NO JSON.parse()
    const storedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);
    
    const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
    
    if (storedCode) {
      // 2. Look up the full currency object using the retrieved string code
      return SUPPORTED_CURRENCIES.find(c => c.code === storedCode) || defaultCurrency;
    }
    return defaultCurrency;
  }
  return SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
};

export function CurrencyProvider({ children }) {
  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  const setCurrency = useCallback((currencyCode) => {
    const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (newCurrency) {
      setPreferredCurrency(newCurrency);
      // 3. Store the RAW currency code string in localStorage. NO JSON.stringify() needed.
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency.code);
    }
  }, []);

  // Ensure state syncs on mount if needed (optional cleanup step)
  useEffect(() => {
    const initialCurrency = getInitialCurrency();
    if (preferredCurrency.code !== initialCurrency.code) {
        setPreferredCurrency(initialCurrency);
    }
  }, []);

  const value = {
    preferredCurrency,
    setCurrency,
    SUPPORTED_CURRENCIES,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  return useContext(CurrencyContext);
};