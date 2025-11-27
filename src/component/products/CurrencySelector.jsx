// src/components/CurrencySelector.jsx

import React from 'react';
import { useCurrency, SUPPORTED_CURRENCIES } from './useCurrency'; // Adjust path as needed

export default function CurrencySelector() {
  const { preferredCurrency, setCurrency } = useCurrency();

  const handleChange = (event) => {
    setCurrency(event.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Currency:
      </label>
      <select
        id="currency-select"
        value={preferredCurrency.code}
        onChange={handleChange}
        className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {`${currency.symbol} ${currency.code}`}
          </option>
        ))}
      </select>
    </div>
  );
}