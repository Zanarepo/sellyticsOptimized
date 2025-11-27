// src/components/Expenses/ExpenseSummaryCard.jsx
import React, { useCallback, useEffect, useState } from "react";

const CURRENCY_STORAGE_KEY = "preferred_currency";

const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

const useCurrencyState = () => {
  const getInitialCurrency = () => {
    if (typeof window !== "undefined") {
      const storedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === "NGN") || SUPPORTED_CURRENCIES[0];
      return storedCode
        ? SUPPORTED_CURRENCIES.find(c => c.code === storedCode) || defaultCurrency
        : defaultCurrency;
    }
    return SUPPORTED_CURRENCIES[0];
  };

  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  useEffect(() => {
    setPreferredCurrency(getInitialCurrency());
  }, []);

  return { preferredCurrency };
};

// PERFECT FORMATTER — Matches Unpaid Cards 100%
const useCurrencyFormatter = (preferredCurrency) =>
  useCallback((value) => {
    const num = Number(value);
    const abs = Math.abs(num);

    // Smart abbreviation: 1,250,000 → ₦1.3M
    if (abs >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = (Math.log10(abs) / 3) | 0;
      const suffix = suffixes[tier];
      const scale = Math.pow(1000, tier);
      const scaled = num / scale;
      return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffix}`;
    }

    // Below 1M → full number with symbol only
    return `${preferredCurrency.symbol}${abs.toLocaleString('en-NG')}`;
  }, [preferredCurrency]);

export default function ExpenseSummaryCard({ totalExpenses = 0, monthlyExpenses = 0, todayExpenses = 0 }) {
  const { preferredCurrency } = useCurrencyState();
  const formatPrice = useCurrencyFormatter(preferredCurrency);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

      {/* Total Expenses */}
      <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 
                      p-6 rounded-xl shadow-md border border-red-200 dark:border-red-700 
                      text-center transform hover:scale-105 transition-all duration-300">
        <h3 className="text-sm font-bold text-red-700 dark:text-red-200 uppercase tracking-wider">
          Total Expenses
        </h3>
        <p className="text-4xl font-extrabold text-red-800 dark:text-red-100 mt-3">
          {formatPrice(totalExpenses)}
        </p>
      </div>

      {/* This Month */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 
                      p-6 rounded-xl shadow-md border border-orange-200 dark:border-amber-700 
                      text-center transform hover:scale-105 transition-all duration-300">
        <h3 className="text-sm font-bold text-orange-700 dark:text-orange-200 uppercase tracking-wider">
          This Month
        </h3>
        <p className="text-4xl font-extrabold text-orange-800 dark:text-orange-100 mt-3">
          {formatPrice(monthlyExpenses)}
        </p>
      </div>

      {/* Today's Expenses */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 
                      p-6 rounded-xl shadow-md border border-purple-200 dark:border-indigo-700 
                      text-center transform hover:scale-105 transition-all duration-300">
        <h3 className="text-sm font-bold text-purple-700 dark:text-purple-200 uppercase tracking-wider">
          Today
        </h3>
        <p className="text-4xl font-extrabold text-purple-800 dark:text-purple-100 mt-3">
          {formatPrice(todayExpenses)}
        </p>
      </div>
    </div>
  );
}