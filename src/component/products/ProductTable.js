import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useState, useEffect, useCallback } from 'react';
import Pagination from './Pagination';
import { supabase } from '../../supabaseClient';

const ITEMS_PER_PAGE = 10;
const CURRENCY_STORAGE_KEY = 'preferred_currency';

// --- CURRENCY LOGIC DEFINITION ---
const SUPPORTED_CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira' }, 
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
];

/**
 * Symbol-independent Number Formatter (Taken from your formatCurrency logic)
 */

/**
 * Custom hook logic (embedded) to manage currency state and localStorage.
 */
const useCurrencyState = () => {
  const getInitialCurrency = () => {
    if (typeof window !== 'undefined') {
      const storedCode = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
      
      if (storedCode) {
        return SUPPORTED_CURRENCIES.find(c => c.code === storedCode) || defaultCurrency;
      }
      return defaultCurrency;
    }
    return SUPPORTED_CURRENCIES.find(c => c.code === 'NGN') || SUPPORTED_CURRENCIES[0];
  };

  const [preferredCurrency, setPreferredCurrency] = useState(getInitialCurrency);

  const setCurrency = useCallback((currencyCode) => {
    const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (newCurrency) {
      setPreferredCurrency(newCurrency);
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency.code);
    }
  }, []);

  return { preferredCurrency, setCurrency };
};

/**
 * Currency Selection Component (embedded)
 */
const CurrencySelector = ({ preferredCurrency, setCurrency }) => {
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
};
// --- END CURRENCY LOGIC ---


export default function ProductTable({
  filtered,
  onEdit,
  onDelete,
  onDetail,
  // The original formatCurrency prop is no longer needed/used here
  storeId,
}) {
  const [page, setPage] = useState(1);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const { preferredCurrency, setCurrency } = useCurrencyState(); 

  const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const rows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);


 
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


  
  // Check if current user is store owner (Existing logic)
  useEffect(() => {
    const checkPermission = async () => {
      const userEmail = localStorage.getItem('user_email')?.trim();
      if (!userEmail || !storeId) {
        setIsStoreOwner(false);
        return;
      }

      try {
        // First: check if user is store owner
        const { data: ownerData, error: ownerError } = await supabase
          .from('stores')
          .select('id')
          .eq('id', storeId)
          .eq('email_address', userEmail)
          .single();

        if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

        if (ownerData) {
          setIsStoreOwner(true);
          return;
        }

        // Not owner → check if in store_users (allowed to edit, NOT delete)
        const { error: userError } = await supabase
          .from('store_users')
          .select('id')
          .eq('store_id', storeId)
          .eq('email_address', userEmail)
          .single();

        if (userError && userError.code !== 'PGRST116') throw userError;

        setIsStoreOwner(false); // store_users = false → no delete
      } catch (err) {
        console.error('Permission check failed:', err);
        setIsStoreOwner(false);
      }
    };

    checkPermission();
  }, [storeId]);

  return (
    <>
      <div className="flex justify-end mb-4">
        {/* --- CURRENCY SELECTOR PLACEMENT --- */}
        <CurrencySelector 
          preferredCurrency={preferredCurrency} 
          setCurrency={setCurrency} 
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Desc.</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Purchase</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Selling</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">IDs</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-5 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map(p => {
                const isUnique = p.is_unique;
                const qty = isUnique ? p.deviceList?.length || 0 : p.purchase_qty;
                const idLabel = isUnique ? `${qty} ID(s)` : (p.device_id || 'View');

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {p.description || '—'}
                    </td>
                    
                    {/* --- FIXED PURCHASE PRICE DISPLAY --- */}
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                     {formatPriceNumber(p.purchase_price)}
                    </td>
                    
                    <td className="px-5 py-4 font-medium">
                      {qty}
                      {/* --- (unique) indicator separated from price --- */}
                      {isUnique && <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">(unique)</span>}
                    </td>
                    
                    {/* --- FIXED SELLING PRICE DISPLAY --- */}
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                     {formatPriceNumber(p.selling_price)}
                    </td>
                                      
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {p.suppliers_name || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onDetail(p)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium underline-offset-2 hover:underline transition"
                      >
                        {idLabel}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => onEdit(p)}
                          className="text-indigo-600 hover:text-indigo-800 transition transform hover:scale-110"
                          title="Edit Product"
                        >
                          <FaEdit size={18} />
                        </button>

                        {isStoreOwner ? (
                          <button
                            onClick={() => onDelete(p)}
                            className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                            title="Delete Product"
                          >
                            <FaTrashAlt size={18} />
                          </button>
                        ) : (
                          <div
                            className="text-gray-400 cursor-not-allowed"
                            title="Only store owner can delete"
                          >
                            <FaTrashAlt size={18} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > 1 && (
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t">
            <Pagination
              total={filtered.length}        // Total items
              pageSize={ITEMS_PER_PAGE}      // 10
              current={page}                 // Current page
              onChange={setPage}             // Page change handler
            />
          </div>
        )}
      </div>
    </>
  );
}