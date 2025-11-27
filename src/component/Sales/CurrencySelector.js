// src/component/Sales/CurrencySelector.jsx
import React from 'react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
];

const DEFAULT_CURRENCY = CURRENCIES[0];

export default function CurrencySelector({ currency, setCurrency }) {
  // Triple defense — this will NEVER fail
  const safeCurrency = 
    currency && 
    typeof currency === 'object' && 
    currency.code && 
    currency.symbol 
      ? currency 
      : DEFAULT_CURRENCY;

  return (
    <select
      value={safeCurrency.code}
      onChange={(e) => {
        const selected = CURRENCIES.find(c => c.code === e.target.value) || DEFAULT_CURRENCY;
        setCurrency(selected);
      }}
      className="px-4 py-2 text-sm font-medium border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
    >
      {CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>
          {c.name} ({c.symbol})
        </option>
      ))}
    </select>
  );
}