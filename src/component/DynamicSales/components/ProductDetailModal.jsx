// src/components/DynamicSales/ProductDetailModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaBoxOpen, FaMoneyBillWave, FaUserTie } from 'react-icons/fa';
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

export default function ProductDetailModal({ productId, productName, onClose, ownedStores = [], isMultiStoreOwner }) {
  const { preferredCurrency } = useCurrencyState();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = useCallback((val) => {
    const num = Number(val) || 0;
    if (Math.abs(num) >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
      const scaled = num / Math.pow(1000, tier);
      return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffixes[tier] || ''}`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: preferredCurrency.code
    }).format(num);
  }, [preferredCurrency]);

  useEffect(() => {
    const fetchProductStats = async () => {
      if (!productId) return;

      try {
        // 1. Fetch sales + user names
// 1. Fetch sales — using EXACT FK names from your error
let salesQuery = supabase
  .from('dynamic_sales')
  .select(`
    quantity,
    amount,
    store_id,
    created_by_user_id,
    created_by_owner,
    store_users(full_name),
    sale_store:stores!dynamic_sales_store_id_fkey(shop_name),
    owner_store:stores!dynamic_sales_created_by_owner_fkey(full_name, shop_name)
  `)
  .eq('dynamic_product_id', productId);

// Multi-store filter
if (isMultiStoreOwner && ownedStores.length > 0) {
  const storeIds = ownedStores.map(s => s.id);
  salesQuery = salesQuery.in('store_id', storeIds);
}

const { data: sales, error: salesError } = await salesQuery;
if (salesError) {
  console.error('Sales fetch error:', salesError);
  throw salesError;
}


// Multi-store filter
if (isMultiStoreOwner && ownedStores.length > 0) {
const storeIds = ownedStores.map(s => s.id);
salesQuery = salesQuery.in('store_id', storeIds);
}



        // 2. Fetch inventory + purchase_price in ONE clean query
        const { data: invData, error: invError } = await supabase
          .from('dynamic_inventory')
          .select(`
            available_qty,
            dynamic_product!inner(purchase_price, selling_price)
          `)
          .eq('dynamic_product_id', productId)
          .maybeSingle();

        if (invError) throw invError;

        const remaining = invData?.available_qty || 0;
        const purchasePrice = invData?.dynamic_product?.purchase_price || 0;
        const sellingPrice = invData?.dynamic_product?.selling_price || 0;

        const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
        const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
        const inventoryValue = remaining * purchasePrice;
        const hasCostPrice = purchasePrice > 0;

        // Top performers
        // Top performers — handles staff AND owner perfectly
const performerMap = {};

sales.forEach(s => {
  let creatorName = 'Sold By Owner';
  let storeName = s.sale_store?.shop_name || 'Unknown Store';

  // 1. Staff made the sale
  if (s.created_by_user_id && s.store_users?.full_name) {
    creatorName = s.store_users.full_name;
  }
  // 2. Owner made the sale — uses full_name from stores table
  else if (s.created_by_owner && s.owner_store?.full_name) {
    creatorName = s.owner_store.full_name + ' (Owner)';
    storeName = s.owner_store.shop_name || storeName;
  }
  // 3. Fallback
  else if (s.created_by_owner) {
    creatorName = (storeName || 'Store Owner') + ' (Owner)';
  }

  const displayName = storeName !== 'Unknown Store'
    ? `${creatorName} @ ${storeName}`
    : creatorName;

  performerMap[displayName] = (performerMap[displayName] || 0) + s.quantity;
});

const topPerformers = Object.entries(performerMap)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5);


        // Multi-store breakdown
        const storeSales = {};
        if (isMultiStoreOwner && ownedStores.length > 0) {
          ownedStores.forEach(store => {
            storeSales[store.id] = { name: store.shop_name, sold: 0, revenue: 0 };
          });
          sales.forEach(s => {
            if (storeSales[s.store_id]) {
              storeSales[s.store_id].sold += s.quantity;
              storeSales[s.store_id].revenue += s.amount;
            }
          });
        }


        setStats({
          totalSold,
          totalRevenue,
          remaining,
          inventoryValue,
          hasCostPrice,
          purchasePrice,
          potentialRevenue: remaining * sellingPrice,
          topPerformers,
          storeSales: Object.values(storeSales).filter(s => s.sold > 0),
        });

      } catch (err) {
        console.error('Failed to load product stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductStats();
  }, [productId, isMultiStoreOwner, ownedStores]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{productName}</h2>
            <p className="text-sm text-gray-500">Product Performance Overview</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-5 rounded-xl text-center">
              <FaBoxOpen className="mx-auto text-blue-600 mb-2" size={28} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sold</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalSold}</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 p-5 rounded-xl text-center">
              <FaMoneyBillWave className="mx-auto text-green-600 mb-2" size={28} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatPrice(stats.totalRevenue)}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/30 p-5 rounded-xl text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.remaining}</p>
            </div>

            {/* Inventory Valuation Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 p-6 rounded-xl shadow-sm col-span-2 md:col-span-4">
              <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-4">Inventory Valuation</h3>
              {stats.hasCostPrice ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 dark:text-gray-400">Current Value (Cost)</span>
                    <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {formatPrice(stats.inventoryValue)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 border-t pt-3">
                    <div className="flex justify-between">
                      <span>{stats.remaining} units × {formatPrice(stats.purchasePrice)}/unit</span>
                    </div>
                  </div>
                  {stats.potentialRevenue > 0 && (
                    <div className="text-sm opacity-75 border-t pt-3">
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Potential Revenue (if sold)</span>
                        <span className="font-medium">{formatPrice(stats.potentialRevenue)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-600 font-medium">Purchase price not set</p>
                  <p className="text-xs text-gray-500 mt-1">Add purchase_price to this product</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          {stats.topPerformers.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FaUserTie className="text-indigo-600" />
                Top Sellers
              </h3>
              <div className="space-y-3">
                {stats.topPerformers.map(([name, qty], i) => (
                  <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <span className="font-medium">{i + 1}. {name}</span>
                    <span className="font-bold text-indigo-600">{qty} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Store Breakdown */}
          {isMultiStoreOwner && stats.storeSales.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Sales by Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.storeSales.map(store => (
                  <div key={store.name} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl">
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-400">{store.name}</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sold:</span>
                        <span className="font-bold">{store.sold} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-bold text-green-600">{formatPrice(store.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Sales */}
          {stats.totalSold === 0 && (
            <div className="text-center py-16 text-gray-500">
              <FaBoxOpen size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No sales recorded yet for this product.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}