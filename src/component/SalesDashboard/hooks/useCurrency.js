// src/components/SalesDashboard/hooks/useCurrency.js
import { useState, useCallback } from "react";

const STORAGE_KEY = "preferred_currency";

export const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

export function useCurrency() {
  // Lazy initialization from localStorage
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    if (typeof window === "undefined") return SUPPORTED_CURRENCIES[0];
    const code = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
  });

  // Setter to update preferred currency
  const setCurrency = useCallback((code) => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setPreferredCurrency(found);
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  // Currency formatting function — CLEAN & PROFESSIONAL
  const formatCurrency = useCallback(
    (value) => {
      const num = Number(value) || 0;
      const abs = Math.abs(num);
      const symbol = preferredCurrency.symbol;

      // 1. Millions and above → 1.2M, 12.5M (1 decimal, no trailing .0)
      if (abs >= 1_000_000) {
        const millions = num / 1_000_000;
        const formatted = millions.toFixed(1).replace(/\.0$/, "");
        return `${symbol}${formatted}M`;
      }

      // 2. 100K and above → 100K, 568K (rounded, no decimals)
      if (abs >= 100_000) {
        const thousands = Math.round(num / 1000);
        return `${symbol}${thousands.toLocaleString()}K`;
      }

      // 3. Below 100K → full currency format (e.g. ₦45,678.00 or $12,500)
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: preferredCurrency.code,
        minimumFractionDigits: 0,  // Clean look for whole numbers
        maximumFractionDigits: 2,
      }).format(num);
    },
    [preferredCurrency]
  );

  return { preferredCurrency, setCurrency, SUPPORTED_CURRENCIES, formatCurrency };
}