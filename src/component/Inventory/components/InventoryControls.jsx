import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/inventoryPreferences';

export default function InventoryControls({
  searchTerm,
  setSearchTerm,
  lowStockItems = [],
  canAdjust = true,
  onThresholdChange,
  onSortChange,
  onToggleLowStock,
  showLowStock: externalShowLowStock,
}) {
  const prefs = getPreferences();
  const [lowStockThreshold, setLowStockThreshold] = useState(prefs.lowStockThreshold || 5);
  const [lowStockSort, setLowStockSort] = useState(prefs.lowStockSort || 'quantity');
  const [showLowStock, setShowLowStock] = useState(externalShowLowStock ?? false);

  useEffect(() => onThresholdChange?.(lowStockThreshold), [lowStockThreshold, onThresholdChange]);
  useEffect(() => onSortChange?.(lowStockSort), [lowStockSort, onSortChange]);
  useEffect(() => onToggleLowStock?.(showLowStock), [showLowStock, onToggleLowStock]);

  const handleThresholdChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setLowStockThreshold(value);
    savePreferences({ lowStockThreshold: value });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setLowStockSort(value);
    savePreferences({ lowStockSort: value });
  };

  const handlePageSizeChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 10);
    savePreferences({ pageSize: value });
  };

  const toggleLowStock = () => setShowLowStock(prev => !prev);

  return (
    <div className="w-full space-y-5 mb-8">

      {/* Top Row: Search + Low Stock Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">

        {/* Search Input - Full width, beautiful */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 text-base bg-white dark:bg-gray-800 
                       border border-gray-300 dark:border-gray-700 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       transition-all duration-200 shadow-sm"
          />
        </div>

        {/* Low Stock Toggle Button */}
        {canAdjust && (
          <button
            onClick={toggleLowStock}
            disabled={lowStockItems.length === 0}
            className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg
              ${lowStockItems.length === 0
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70'
                : showLowStock
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30 ring-4 ring-red-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
              } transform active:scale-95`}
          >
            {showLowStock ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="hidden sm:inline">
              {lowStockItems.length === 0 ? 'No Low Stock' : `Low Stock (${lowStockItems.length})`}
            </span>
            <span className="sm:hidden">
              Low Stock ({lowStockItems.length})
            </span>
          </button>
        )}
      </div>

      {/* Bottom Row: Preferences (collapses nicely on mobile) */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 
                      rounded-xl p-5 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-4 text-sm">

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={handleThresholdChange}
              className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>

          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">Page size:</span>
            <input
              type="number"
              min="1"
              max="100"
              defaultValue={prefs.pageSize || 10}
              onChange={handlePageSizeChange}
              className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={lowStockSort}
              onChange={handleSortChange}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="quantity">Quantity</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}