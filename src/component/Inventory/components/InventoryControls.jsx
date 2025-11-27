import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getPreferences, savePreferences } from '../utils/inventoryPreferences';

export default function InventoryControls({
  searchTerm,
  setSearchTerm,
  lowStockItems = [],
  canAdjust = true,
  onThresholdChange,
  onSortChange,
  onToggleLowStock,
  showLowStock: externalShowLowStock, // optional external control
}) {
  const prefs = getPreferences();

  const [lowStockThreshold, setLowStockThreshold] = useState(prefs.lowStockThreshold || 5);
  const [lowStockSort, setLowStockSort] = useState(prefs.lowStockSort || 'quantity');
  const [showLowStock, setShowLowStock] = useState(externalShowLowStock ?? false);

  // Sync internal state → parent (if callbacks provided)
  useEffect(() => {
    onThresholdChange?.(lowStockThreshold);
  }, [lowStockThreshold, onThresholdChange]);

  useEffect(() => {
    onSortChange?.(lowStockSort);
  }, [lowStockSort, onSortChange]);

  useEffect(() => {
    onToggleLowStock?.(showLowStock);
  }, [showLowStock, onToggleLowStock]);

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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">

      {/* Search Input — Full width on mobile, half on desktop */}
      <input
        type="text"
        placeholder="Search by product name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full lg:w-96 p-3 text-base border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 
                   dark:bg-gray-800 dark:border-gray-700 dark:text-white 
                   transition-all duration-200 search-input"
      />

      {/* Right Side Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">

        {/* Preferences Panel — Compact & Clean */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={handleThresholdChange}
              className="w-20 px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600"
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
              className="w-20 px-2 py-1 border rounded dark:bg-gray-900 dark:border-gray-600"
            />
          </label>

          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={lowStockSort}
              onChange={handleSortChange}
              className="px-3 py-1 border rounded dark:bg-gray-900 dark:border-gray-600"
            >
              <option value="quantity">Quantity</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {/* Low Stock Toggle Button — Your Signature Style */}
        {canAdjust && (
          <button
            onClick={toggleLowStock}
            disabled={lowStockItems.length === 0}
            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm
              ${lowStockItems.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                : showLowStock
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
              } low-stock-toggle`}
          >
            {showLowStock ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>
              {lowStockItems.length === 0
                ? 'No Low Stock'
                : showLowStock
                  ? `Low Stock (${lowStockItems.length})`
                  : `Low Stock (${lowStockItems.length})`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}