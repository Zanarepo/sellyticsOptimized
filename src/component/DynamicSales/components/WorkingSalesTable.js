// src/components/Sales/SalesTable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';

const CURRENCY_STORAGE_KEY = 'preferred_currency';
const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

const useCurrencyState = () => {
  const getInitial = () => {
    if (typeof window === 'undefined') return SUPPORTED_CURRENCIES[0];
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return SUPPORTED_CURRENCIES.find(c => c.code === stored) || SUPPORTED_CURRENCIES[0];
  };
  const [currency, setCurrency] = useState(getInitial);
  useEffect(() => {
    const handler = () => setCurrency(getInitial());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return { preferredCurrency: currency };
};

export default function SalesTable({
  viewMode,
  paginatedSales = [],
  paginatedTotals = [],
  openDetailModal,
  onEdit,
  onDelete,
  storeId,
}) {
  const { preferredCurrency } = useCurrencyState();
  const [canDelete, setCanDelete] = useState(false);
  const [isMultiStoreOwner, setIsMultiStoreOwner] = useState(false);
  const [ownedStores, setOwnedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');

  // trim & lowercase user email from localStorage
  const userEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('user_email') || '').trim().toLowerCase()
    : null;

  const formatPrice = useCallback((val) => {
    const num = Number(val) || 0;
    if (Math.abs(num) >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
      const scaled = num / Math.pow(1000, tier);
      return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffixes[tier] || ''}`;
    }
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: preferredCurrency.code }).format(num);
    } catch (e) {
      // fallback if currency code not supported
      return `${preferredCurrency.symbol}${num.toLocaleString()}`;
    }
  }, [preferredCurrency]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).replace(',', ',');
  };

  // FINAL SECURITY LOGIC — ONLY store_owners.email can see multi-store
  useEffect(() => {
    if (!userEmail) {
      setIsMultiStoreOwner(false);
      setCanDelete(false);
      setOwnedStores([]);
      setSelectedStoreId('all');
      return;
    }

    let mounted = true;
    const checkTrueOwner = async () => {
      try {
        const { data: realOwner } = await supabase
          .from('store_owners')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (!mounted) return;

        if (realOwner) {
          const { data: stores } = await supabase
            .from('stores')
            .select('id, shop_name')
            .eq('owner_user_id', realOwner.id)
            .order('shop_name');
          if (!mounted) return;
          if (stores && stores.length > 0) {
            // normalize id to number and shop_name presence
            const normalized = stores.map(s => ({ id: Number(s.id), shop_name: s.shop_name }));
            setOwnedStores(normalized);
            setSelectedStoreId('all');
            setIsMultiStoreOwner(normalized.length > 1);
          } else {
            setOwnedStores([]);
            setIsMultiStoreOwner(false);
          }
          setCanDelete(true); // real owner can delete
          return;
        }

        // Not the real owner -> maybe a store manager for the currently selected storeId
        if (storeId) {
          const { data: store } = await supabase
            .from('stores')
            .select('email_address')
            .eq('id', storeId)
            .single();
          if (!mounted) return;
          if (store?.email_address?.toLowerCase() === userEmail) {
            setCanDelete(true);
          } else {
            setCanDelete(false);
          }
        } else {
          setCanDelete(false);
        }

        // Not real owner => NO multi-store view
        setIsMultiStoreOwner(false);
        setOwnedStores([]);
      } catch (err) {
        // fail safe
        console.error('Error checking owner:', err);
        if (!mounted) return;
        setIsMultiStoreOwner(false);
        setOwnedStores([]);
        setCanDelete(false);
      }
    };

    checkTrueOwner();
    return () => { mounted = false; };
  }, [userEmail, storeId]);

  // Helper: normalize a sale object's store id to a Number (or null)
  const getSaleStoreIdNumber = (s) => {
    // try a few common shapes
    const candidates = [
      s?.store_id,
      s?.sale_store?.id,
      s?.store?.id,
      s?.sale_store_id,
      s?.store_id?.id, // defensive
    ];
    for (const c of candidates) {
      if (c === undefined || c === null) continue;
      const n = Number(c);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  };

  // Helper: get shop name from sale with fallbacks
  const getSaleShopName = (s) => {
    if (s?.sale_store?.shop_name) return s.sale_store.shop_name;
    if (s?.store?.shop_name) return s.store.shop_name;
    if (s?.sale_store_name) return s.sale_store_name;
    const sid = getSaleStoreIdNumber(s);
    if (sid) {
      const found = ownedStores.find(os => Number(os.id) === Number(sid));
      if (found) return found.shop_name;
    }
    return null;
  };

  // Apply store filter (only for multi-store owners)
  const displayedSales = (Array.isArray(paginatedSales) ? paginatedSales : []).filter((s) => {
    if (!isMultiStoreOwner) return true; // no filtering if not multi-store owner
    if (!selectedStoreId || selectedStoreId === 'all') return true;
    const saleStoreId = getSaleStoreIdNumber(s);
    // compare as numbers
    return saleStoreId !== null && saleStoreId === Number(selectedStoreId);
  });

  // === TOTALS VIEW ===
  if (viewMode === 'daily' || viewMode === 'weekly') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {isMultiStoreOwner && (
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold">Multi-Store Summary</h3>
                <p className="text-indigo-100">
                  Viewing: <strong>
                    {selectedStoreId === 'all' ? 'All Stores Combined' : (ownedStores.find(s => s.id === Number(selectedStoreId))?.shop_name || 'Unknown')}
                  </strong>
                </p>
              </div>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(String(e.target.value))}
                className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold"
              >
                <option value="all">All Stores</option>
                {ownedStores.map(s => <option key={s.id} value={String(s.id)}>{s.shop_name}</option>)}
              </select>
            </div>
          </div>
        )}
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Period</th>
              <th className="px-6 py-4 text-left font-semibold">Total ({preferredCurrency.symbol})</th>
              <th className="px-6 py-4 text-left font-semibold">Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTotals.map((t, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">{t.period}</td>
                <td className="px-6 py-4 font-bold text-green-600">{formatPrice(t.total)}</td>
                <td className="px-6 py-4 text-center">{t.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      {isMultiStoreOwner && (
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Your Business Empire</h2>
              <p className="text-indigo-100">
                {ownedStores.length} store{ownedStores.length !== 1 ? 's' : ''} •{' '}
                <strong>
                  {selectedStoreId === 'all' ? 'All Combined' : (ownedStores.find(s => s.id === Number(selectedStoreId))?.shop_name || 'Unknown')}
                </strong>
              </p>
            </div>
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(String(e.target.value))}
              className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold"
            >
              <option value="all">All Stores Combined</option>
              {ownedStores.map(s => <option key={s.id} value={String(s.id)}>{s.shop_name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
            <tr>
              {isMultiStoreOwner && <th className="px-6 py-4 text-left font-bold text-indigo-700 uppercase text-xs">Store</th>}
              {['Product', 'Customer', 'Qty', 'Unit Price', 'Amount', 'Payment', 'IDs/Sizes', 'Date Sold', 'Actions'].map(h => (
                <th key={h} className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedSales.length === 0 ? (
              <tr><td colSpan={isMultiStoreOwner ? 10 : 9} className="text-center py-16 text-gray-500 text-lg">No sales found</td></tr>
            ) : (
              displayedSales.map((s, idx) => {
                const shopName = getSaleShopName(s) || 'Unknown Store';
                return (
                  <tr key={s.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    {isMultiStoreOwner && (
                      <td className="px-6 py-4">
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 rounded-full text-sm font-bold">
                          {shopName}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium">{s.dynamic_product?.name || s.product_name || 'Deleted'}</td>
                    <td className="px-6 py-4">{s.customer_name || 'Walk-in'}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{s.quantity ?? '—'}</td>
                    <td className="px-6 py-4">{formatPrice(s.unit_price ?? s.unit_price_amount ?? 0)}</td>
                    <td className="px-6 py-4 font-bold text-green-600">{formatPrice(s.amount ?? (s.quantity * s.unit_price) ?? 0)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        s.payment_method === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                        s.payment_method === 'Transfer' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {s.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(s.deviceIds) && s.deviceIds.length > 0 ? (
                        <button onClick={() => openDetailModal(s)} className="text-indigo-600 hover:underline font-medium">
                          View {s.deviceIds.length} ID{s.deviceIds.length > 1 ? 's' : ''}
                        </button>
                      ) : (s.device_unique_ids?.length > 0 ? (
                        <button onClick={() => openDetailModal(s)} className="text-indigo-600 hover:underline font-medium">
                          View {s.device_unique_ids.length} ID{s.device_unique_ids.length > 1 ? 's' : ''}
                        </button>
                      ) : '—')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(s.sold_at || s.created_at || s.date_sold)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 items-center">
                        <button onClick={() => onEdit(s, idx)} className="text-indigo-600 hover:scale-110 transition">
                          <FaEdit size={19} />
                        </button>
                        {canDelete ? (
                          <button onClick={() => onDelete(s)} className="text-red-600 hover:scale-110 transition">
                            <FaTrashAlt size={19} />
                          </button>
                        ) : (
                          <div className="text-gray-400">
                            <FaTrashAlt size={19} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
