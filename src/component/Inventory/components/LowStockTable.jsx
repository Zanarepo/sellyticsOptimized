import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * LowStockTable component
 * @param {Array} lowStockItems - filtered inventory items below threshold
 * @param {Function} onProductClick - callback when row is clicked or adjust button clicked
 * @param {boolean} canAdjust - whether current user can adjust inventory
 */
export default function LowStockTable({
  lowStockItems,
  onProductClick,
  canAdjust,
}) {
  if (!lowStockItems || lowStockItems.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Low Stock Items</h2>
      <div className="overflow-x-auto rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-200 dark:bg-gray-700 text-indigo-500 dark:text-indigo-400">
            <tr>
              <th className="p-2 text-left whitespace-nowrap">Product</th>
              <th className="p-2 text-left whitespace-nowrap">Available Qty</th>
              <th className="p-2 text-left whitespace-nowrap">Sold</th>
              {canAdjust && <th className="p-2 text-left whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <td
                  className="p-2 whitespace-nowrap cursor-pointer"
                  onClick={() => onProductClick(item)}
                >
                  {item.dynamic_product?.name || 'Unknown'}
                </td>
                <td className="p-2 whitespace-nowrap text-red-500 flex items-center gap-1">
                  {item.available_qty}
                  <AlertCircle size={16} className="text-red-500" />
                </td>
                <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
                {canAdjust && (
                  <td className="p-2 whitespace-nowrap">
                    <button
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => onProductClick(item)}
                    >
                      Adjust Qty
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
