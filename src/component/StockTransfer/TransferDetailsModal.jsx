// src/components/stockTransfer/TransferDetailsModal.jsx
import React, { useState, useEffect, useCallback } from "react";

const CURRENCY_STORAGE_KEY = "preferred_currency";

const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

// --- Hook: Dynamic currency formatter ---
const useCurrencyFormatter = (currency) =>
  useCallback(
    (value) => {
      const num = Number(value);
      if (isNaN(num)) return `${currency.symbol}0`;

      const abs = Math.abs(num);

      // Abbreviation: K, M, B, T
      if (abs >= 1_000_000) {
        const suffixes = ["", "K", "M", "B", "T"];
        const tier = (Math.log10(abs) / 3) | 0;

        if (tier >= suffixes.length) return `${currency.symbol}${num.toLocaleString()}`;

        const suffix = suffixes[tier];
        const scale = Math.pow(1000, tier);
        const scaled = num / scale;

        const formatted = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
        return `${currency.symbol}${formatted}${suffix}`;
      }

      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(num);
      } catch {
        return `${currency.symbol}${num.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      }
    },
    [currency]
  );

// --- Hook: Load preferred currency ---
const usePreferredCurrency = () => {
  const getInitialCurrency = () => {
    if (typeof window === "undefined") return SUPPORTED_CURRENCIES[0];
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === stored) ||
      SUPPORTED_CURRENCIES.find((c) => c.code === "NGN") ||
      SUPPORTED_CURRENCIES[0]
    );
  };

  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  useEffect(() => {
    setPreferredCurrency(getInitialCurrency());
  }, []);

  return preferredCurrency;
};

export default function TransferDetailsModal({ open, onClose, transfer }) {
  // ✅ Hooks must always be called first
  const preferredCurrency = usePreferredCurrency();
  const formatPrice = useCurrencyFormatter(preferredCurrency);

  if (!open || !transfer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Transfer Details
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm">

          {/* Transfer Info */}
          <div className="grid grid-cols-1 gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Quantity</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{transfer.quantity}</p>
            </div>

            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Worth</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(transfer.worth)}</p>
            </div>

            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Status</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{transfer.status}</p>
            </div>

            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Date</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{new Date(transfer.requested_at).toLocaleString()}</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
