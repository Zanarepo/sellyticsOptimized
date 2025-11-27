// components/Unpaid/SummaryCards.jsx
import React, { useCallback, useEffect, useState } from "react";

const CURRENCY_STORAGE_KEY = "preferred_currency";

// --- SUPPORTED CURRENCIES (FIXED SYMBOLS) ---
const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

// --- HOOK TO LOAD CURRENCY FROM LOCALSTORAGE ---
const useCurrencyState = () => {
  const getInitialCurrency = () => {
    if (typeof window !== "undefined") {
      const storedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);

      const defaultCurrency =
        SUPPORTED_CURRENCIES.find((c) => c.code === "NGN") ||
        SUPPORTED_CURRENCIES[0];

      if (storedCode) {
        return (
          SUPPORTED_CURRENCIES.find((c) => c.code === storedCode) ||
          defaultCurrency
        );
      }
      return defaultCurrency;
    }
    return SUPPORTED_CURRENCIES[0];
  };

  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  // sync with localStorage on mount
  useEffect(() => {
    setPreferredCurrency(getInitialCurrency());
  }, []);

  return { preferredCurrency };
};

// --- FORMATTER (FIXED) ---
const useCurrencyFormatter = (preferredCurrency) =>
  useCallback(
    (value) => {
      const num = Number(value);
      const abs = Math.abs(num);

      // Format abbreviation (K, M, B, T)
      if (abs >= 1_000_000) {
        const suffixes = ["", "K", "M", "B", "T"];
        const tier = (Math.log10(abs) / 3) | 0;
        const suffix = suffixes[tier];
        const scale = Math.pow(1000, tier);
        const scaled = num / scale;

        return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffix}`;
      }

      // Standard formatting with currency
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: preferredCurrency.code,
        minimumFractionDigits: 0,
      }).format(num);
    },
    [preferredCurrency]
  );

export default function SummaryCards({ metrics }) {
  const { preferredCurrency } = useCurrencyState();
  const formatPriceNumber = useCurrencyFormatter(preferredCurrency);

  const { unpaidDevices, unpaidWorth, paidDevices, paidAmount } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

      {/* Unpaid Items */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 
                      p-6 rounded-xl shadow-md border border-red-200 dark:border-red-700 
                      text-center transform hover:scale-105 transition-transform duration-200">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-200 uppercase tracking-wider">
          Unpaid Items
        </h3>
        <p className="text-4xl font-extrabold text-red-800 dark:text-red-100 mt-2">
          {unpaidDevices.toLocaleString()}
        </p>
      </div>

      {/* Unpaid Worth */}
      <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-pink-900 dark:to-pink-800 
                      p-6 rounded-xl shadow-md border border-pink-200 dark:border-pink-700 
                      text-center transform hover:scale-105 transition-transform duration-200">
        <h3 className="text-sm font-semibold text-pink-700 dark:text-pink-200 uppercase tracking-wider">
          Total Unpaid Worth
        </h3>
        <p className="text-3xl font-extrabold text-pink-800 dark:text-pink-100 mt-2">
          {formatPriceNumber(unpaidWorth)}
        </p>
      </div>

      {/* Paid Items */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 
                      p-6 rounded-xl shadow-md border border-green-200 dark:border-emerald-700 
                      text-center transform hover:scale-105 transition-transform duration-200">
        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-200 uppercase tracking-wider">
          Paid / Recovered Items
        </h3>
        <p className="text-4xl font-extrabold text-emerald-800 dark:text-emerald-100 mt-2">
          {paidDevices.toLocaleString()}
        </p>
      </div>

      {/* Total Recovered */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 
                      p-6 rounded-xl shadow-md border border-blue-200 dark:border-indigo-700 
                      text-center transform hover:scale-105 transition-transform duration-200">
        <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-200 uppercase tracking-wider">
          Total Money Recovered
        </h3>
        <p className="text-3xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-2">
          {formatPriceNumber(paidAmount)}
        </p>
      </div>
    </div>
  );
}
