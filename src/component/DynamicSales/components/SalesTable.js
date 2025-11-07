import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

export default function SalesTable({
  viewMode,
  paginatedSales,
  paginatedTotals,
  openDetailModal,
  formatCurrency,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto rounded-lg shadow">
      {viewMode === 'list' ? (
        <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              {['Product', 'Customer', 'Quantity', 'Unit Price', 'Amount', 'Payment', 'Product IDs/Sizes', 'Date Sold', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedSales.map((s, idx) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-sm">{s.dynamic_product.name}</td>
                <td className="px-4 py-2 text-sm">{s.customer_name}</td>
                <td className="px-4 py-2 text-sm">{s.quantity}</td>
                <td className="px-4 py-2 text-sm">₦{formatCurrency(s.unit_price)}</td>
                <td className="px-4 py-2 text-sm">₦{formatCurrency(s.amount)}</td>
                <td className="px-4 py-2 text-sm">{s.payment_method}</td>
                <td className="px-4 py-2 text-sm">
                  {s.deviceIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => openDetailModal(s)}
                      className="text-indigo-600 hover:underline focus:outline-none"
                    >
                      View {s.deviceIds.length} ID{s.deviceIds.length !== 1 ? 's' : ''}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-2 text-sm">{new Date(s.sold_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(s, idx)}
                    className={`text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 edit-button-${idx}`}
                    title="Edit sale"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete sale"
                  >
                    <FaTrashAlt className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Period
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Total Sales (₦)
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                Number of Sales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTotals.map((t, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 text-sm">{t.period}</td>
                <td className="px-4 py-2 text-sm">₦{formatCurrency(t.total)}</td>
                <td className="px-4 py-2 text-sm">{t.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
