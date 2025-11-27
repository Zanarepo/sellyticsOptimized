// DetailModal.jsx — DYNAMIC CURRENCY VERSION
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTimes, FaSearch } from 'react-icons/fa';

const CURRENCY_STORAGE_KEY = 'preferred_currency';

// --- CURRENCY LOGIC DEFINITION (Embedded) ---
const SUPPORTED_CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Naira' }, 
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
];

/**
 * Symbol-independent Number Formatter
 */
const formatPriceNumber = (value) =>
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Custom hook logic (embedded) to manage currency state and localStorage.
 */
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


export default function DetailModal({ product, isOpen, onClose, storeId }) {
  const [soldImeis, setSoldImeis] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Use the currency state hook
  const { preferredCurrency } = useCurrencyState();

  // All IMEIs from product
  const allImeis = useMemo(() => {
    return product.dynamic_product_imeis
      ? product.dynamic_product_imeis
          .split(",")
          .map((s) => ({ imei: s.trim(), size: (product.device_size?.split(',')[product.dynamic_product_imeis.split(',').indexOf(s)] || '').trim() }))
          .filter(i => i.imei)
      : [];
  }, [product.dynamic_product_imeis, product.device_size]);

  // Filter by search
  const filteredImeis = useMemo(() => {
    if (!searchTerm) return allImeis;
    return allImeis.filter(item =>
      item.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allImeis, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredImeis.length / itemsPerPage);
  const paginatedImeis = filteredImeis.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!isOpen || !product.is_unique || allImeis.length === 0) {
      setLoading(false);
      return;
    }

    const fetchSoldStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dynamic_sales')
          .select('device_id')
          .eq('store_id', storeId);

        if (error) throw error;

        const soldSet = new Set();
        data.forEach(sale => {
          if (sale.device_id) {
            sale.device_id
              .toString()
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .forEach(id => soldSet.add(id));
          }
        });

        setSoldImeis(soldSet);
      } catch (err) {
        console.error('Error fetching sold status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldStatus();
  }, [product.id, isOpen, storeId, allImeis.length, product.is_unique]);

  if (!isOpen) return null;

  const isUnique = product.is_unique === true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {product.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* --- PURCHASE PRICE: Dynamic Currency --- */}
            <div>
              <span className="font-medium text-gray-600">Purchase:</span> 
              {preferredCurrency.symbol}{formatPriceNumber(product.purchase_price || 0)}
            </div>
            {/* --- SELLING PRICE: Dynamic Currency --- */}
            <div>
              <span className="font-medium text-gray-600">Selling:</span> 
              {preferredCurrency.symbol}{formatPriceNumber(product.selling_price || 0)}
            </div>
            
            <div><span className="font-medium text-gray-600">Qty:</span> {product.purchase_qty || 0}</div>
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                isUnique ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isUnique ? 'Unique-Tracked' : 'Non-Unique'}
              </span>
            </div>
          </div>

          {/* UNIQUE ITEMS */}
          {isUnique && allImeis.length > 0 && (
            <div className="border-t pt-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold">
                  Items ({filteredImeis.length} of {allImeis.length})
                </h3>
                {/* Search Box */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search IMEI / Size..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading status...</p>
              ) : paginatedImeis.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items found</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedImeis.map(({ imei, size }) => {
                      const isSold = soldImeis.has(imei);
                      return (
                        <div
                          key={imei}
                          className={`flex justify-between items-center p-3 rounded-lg border ${
                            isSold
                              ? 'bg-red-50 border-red-300 dark:bg-red-900/20'
                              : 'bg-green-50 border-green-300 dark:bg-green-900/20'
                          }`}
                        >
                          <div>
                            <div className="font-mono text-sm font-semibold">{imei}</div>
                            {size && <div className="text-xs text-gray-600">Size: {size}</div>}
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            isSold ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                          }`}>
                            {isSold ? 'SOLD' : 'IN STOCK'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* NON-UNIQUE */}
          {!isUnique && (
            <div className="border-t pt-5 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-10 rounded-xl">
                <p className="text-5xl font-bold text-blue-700 dark:text-blue-300">
                  {product.purchase_qty || 0}
                </p>
                <p className="text-lg text-blue-600 dark:text-blue-400 mt-3">
                  Qty Stocked
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-base transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}