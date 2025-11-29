// src/components/Debts/DebtDetailModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCommentAlt } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import useDebt from './useDebt';


const CURRENCY_STORAGE_KEY = 'preferred_currency';

// --- CURRENCY LOGIC DEFINITION (Embedded) ---
const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

const useCurrencyState = () => {
  const getInitialCurrency = () => {
    if (typeof window !== 'undefined') {
      const storedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
      
      if (storedCode) {
        // Retrieve and find the full currency object
        return SUPPORTED_CURRENCIES.find(c => c.code === storedCode) || defaultCurrency;
      }
      return defaultCurrency;
    }
    return SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
  };

  // State initialization uses the function
  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  // Re-fetch currency on component mount to ensure sync with localStorage
  useEffect(() => {
    setPreferredCurrency(getInitialCurrency());
  }, []);

  return { preferredCurrency };
};
// --- END CURRENCY LOGIC ---








export default function DebtDetailModal({ debt: initialDebt, onClose }) {
  const { addNotification, fetchDebts } = useDebt();

  const [debt, setDebt] = useState(initialDebt);
  const [isReturned, setIsReturned] = useState(initialDebt.is_returned || false);
  const [remark, setRemark] = useState(initialDebt.remark || '');
  const [isSaving, setIsSaving] = useState(false);


  const balance = (debt.owed || 0) - (debt.deposited || 0);
  const isPaid = balance <= 0;
  const isPartial = debt.deposited > 0 && balance > 0;
  const hasImeis = debt.device_id && debt.device_id.trim() !== '';

  const deviceIds = hasImeis ? debt.device_id.split(',').map(s => s.trim()) : [];
  const deviceSizes = hasImeis ? (debt.device_sizes || '').split(',').map(s => s.trim()) : [];


  const { preferredCurrency } = useCurrencyState();


  // Auto-save return status + remark
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        isReturned !== initialDebt.is_returned ||
        remark !== (initialDebt.remark || '')
      ) {
        setIsSaving(true);
        try {
          const { error } = await supabase
            .from('debts')
            .update({
              is_returned: isReturned,
              remark: isReturned ? remark.trim() : ''
            })
            .eq('id', debt.id);

          if (error) throw error;

          setDebt(prev => ({ ...prev, is_returned: isReturned, remark: isReturned ? remark : '' }));
          addNotification("Updated", "success");
          fetchDebts();
        } catch (err) {
          addNotification("Save failed", "error");
          setIsReturned(initialDebt.is_returned);
          setRemark(initialDebt.remark || '');
        } finally {
          setIsSaving(false);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [isReturned, remark, debt.id, addNotification, fetchDebts, initialDebt.is_returned, initialDebt.remark]);



  const formatPriceNumber = useCallback((value) => {
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
   

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {debt.product_name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600">
            <FaTimes size={22} />
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm">

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-medium">Customer:</span> {debt.customer_name}</div>
            <div><span className="font-medium">Phone:</span> {debt.phone_number || '—'}</div>
            <div><span className="font-medium">Supplier:</span> {debt.supplier || '—'}</div>
            <div><span className="font-medium">Date:</span> {new Date(debt.date).toLocaleDateString()}</div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Qty</p>
              <p className="text-xl font-bold text-blue-700">{debt.qty}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Owed</p>
              <p className="text-lg font-bold"> {formatPriceNumber(debt.owed || 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Paid</p>
              <p className="text-lg font-bold text-green-700"> {preferredCurrency.symbol}{formatPriceNumber}{(debt.deposited || 0).toLocaleString()}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Balance</p>
              <p className="text-xl font-bold text-red-700"> {preferredCurrency.symbol}{formatPriceNumber}{balance.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              isPaid ? 'bg-green-100 text-green-800' :
              isPartial ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
            </span>
          </div>

          {/* Return Status */}
          <div className="border-t pt-5">
            <p className="font-semibold mb-3">Has item been returned?</p>
            <div className="flex gap-8 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isReturned}
                  onChange={() => setIsReturned(true)}
                  className="w-5 h-5 text-orange-600"
                />
                <span className="font-medium">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isReturned}
                  onChange={() => setIsReturned(false)}
                  className="w-5 h-5 text-gray-600"
                />
                <span className="font-medium">No</span>
              </label>
            </div>

            {/* Remark (only when returned) */}
            {isReturned && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <FaCommentAlt size={16} />
                  <span className="font-medium">Return Reason</span>
                  {isSaving && <span className="text-xs">(saving...)</span>}
                </div>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Why was it returned?"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none resize-none text-sm"
                  rows="3"
                />
              </div>
            )}

            {/* Show old remark if exists */}
            {!isReturned && debt.remark && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                <p className="font-medium text-gray-600">Previous remark:</p>
                <p className="italic">"{debt.remark}"</p>
              </div>
            )}
          </div>

          {/* IMEI List */}
          {hasImeis && deviceIds.length > 0 && (
            <div className="border-t pt-5">
              <p className="font-semibold mb-3">Device IDs ({deviceIds.length})</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {deviceIds.map((id, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-center">
                    {id}
                    {deviceSizes[i] && <div className="text-xs text-gray-500">({deviceSizes[i]})</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete Button */}
         
        </div>

        {/* Footer */}
        <div className="p-4 border-t sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
