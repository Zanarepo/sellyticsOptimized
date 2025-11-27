// components/Unpaid/RepayModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTimes, FaUser, FaBox, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

const CURRENCY_STORAGE_KEY = "preferred_currency";

// --- SUPPORTED CURRENCIES ---
const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

// --- Hook: Preferred currency from localStorage ---
const usePreferredCurrency = () => {
  const getInitialCurrency = () => {
    if (typeof window === 'undefined') return SUPPORTED_CURRENCIES[0];

    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (
      SUPPORTED_CURRENCIES.find(c => c.code === stored) ||
      SUPPORTED_CURRENCIES.find(c => c.code === "NGN") ||
      SUPPORTED_CURRENCIES[0]
    );
  };

  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  useEffect(() => {
    setPreferredCurrency(getInitialCurrency());
  }, []);

  return preferredCurrency;
};

// --- Hook: Dynamic formatter with abbreviation ---
const useCurrencyFormatter = (currency) => {
  return useCallback((value) => {
    const num = Number(value);
    if (isNaN(num)) return `${currency.symbol}0`;

    const abs = Math.abs(num);

    // Abbreviate large numbers (K, M, B)
    if (abs >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = Math.log10(abs) / 3 | 0;
      if (tier >= suffixes.length) return `${currency.symbol}${num.toLocaleString()}`;
      const suffix = suffixes[tier];
      const scale = Math.pow(1000, tier);
      const scaled = num / scale;
      const formatted = scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1);
      return `${currency.symbol}${formatted}${suffix}`;
    }

    // Normal currency formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `${currency.symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  }, [currency]);
};

export default function RepayModal({ debt, onClose, onSuccess }) {
  const [payAmount, setPayAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const storeId = Number(localStorage.getItem('store_id'));

  // Dynamic currency
  const preferredCurrency = usePreferredCurrency();
  const formatPrice = useCurrencyFormatter(preferredCurrency);

  // Calculations
  const balance = (debt.owed || 0) - (debt.deposited || 0);
  const remaining = debt.remaining_balance ?? balance;
  const isPaid = remaining <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);

    if (isNaN(amount) || amount <= 0 || amount > remaining) {
      // Invalid amount → let parent show error if needed
      return;
    }

    setIsSaving(true);

    const newDeposited = (debt.deposited || 0) + amount;
    const newBalance = (debt.owed || 0) - newDeposited;

    const paymentData = {
      store_id: storeId,
      customer_id: debt.customer_id,
      dynamic_product_id: debt.dynamic_product_id,
      customer_name: debt.customer_name,
      product_name: debt.product_name,
      device_id: debt.device_id || null,
      qty: debt.qty,
      owed: debt.owed,
      deposited: newDeposited,
      remaining_balance: newBalance,
      paid_to: paidTo.trim() || null,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const { data: newDebt } = await supabase
        .from('debts')
        .insert(paymentData)
        .select('id')
        .single();

      await supabase.from('debt_payments').insert({
        store_id: storeId,
        customer_id: debt.customer_id,
        dynamic_product_id: debt.dynamic_product_id,
        debt_id: newDebt.id,
        payment_amount: amount,
        paid_to: paidTo.trim() || null,
        payment_date: new Date().toISOString().split('T')[0],
      });

      // Success → notify parent only
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment recording failed:', err);
      // Let parent handle error notification
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FaMoneyBillWave className="text-indigo-600" />
            Record Payment
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm">

          {/* Customer & Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-3">
              <FaUser className="text-indigo-600 text-xl" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Customer</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{debt.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaBox className="text-purple-600 text-xl" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Product</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {debt.product_name} <span className="text-purple-600 font-mono text-sm">#{debt.dynamic_product_id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">Qty</p>
              <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{debt.qty || 1}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Owed</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {formatPrice(debt.owed || 0)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">Paid So Far</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatPrice(debt.deposited || 0)}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-extrabold text-red-700 dark:text-red-300">
                {formatPrice(remaining)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-center py-4">
            <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold tracking-wider ${
              isPaid
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : remaining < (debt.owed || 0) * 0.5
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {isPaid ? 'FULLY PAID' : remaining === (debt.owed || 0) ? 'NOT STARTED' : 'PARTIAL PAYMENT'}
            </span>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={remaining}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={`Max: ${formatPrice(remaining)}`}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:bg-gray-900 text-lg font-medium transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Paid Via (e.g. Cash, GTBank, Mom)
              </label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="Optional: How was payment received?"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:bg-gray-900 transition"
              />
            </div>

            {/* Last Payment Info */}
            {debt.paid_to && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FaCalendarAlt /> Last payment was via:
                </p>
                <p className="font-bold text-indigo-700 dark:text-indigo-400 capitalize">
                  {debt.paid_to} • {debt.last_payment_date ? new Date(debt.last_payment_date).toLocaleDateString() : '—'}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t sticky bottom-0 bg-white dark:bg-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-bold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !payAmount || parseFloat(payAmount) <= 0}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}