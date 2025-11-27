import React from 'react';
import { FaEdit } from 'react-icons/fa';

export default function SalesTable({
  viewMode,
  paginatedSales,
  paginatedTotals,
  openDetailModal,
  formatCurrency,
  onEdit,
  // NEW PROPS FOR MULTI-STORE
  isMultiStoreOwner = false,
  ownedStores = [],
  selectedStoreId = 'all',
  setSelectedStoreId,
}) {
  return (
    <>
      {/* MULTI-STORE SELECTOR – Only show if owner has multiple stores */}
      {isMultiStoreOwner && (
        <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
                Multi-Store Dashboard
                </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You own <strong>{ownedStores.length}</strong> store{ownedStores.length !== 1 ? 's' : ''} •{' '}
                <span className="font-medium text-indigo-700 dark:text-indigo-300">
                  {selectedStoreId === 'all'
                    ? 'Viewing All Stores Combined'
                    : ownedStores.find(s => s.id === Number(selectedStoreId))?.name || 'Unknown Store'}
                </span>
              </p>
            </div>

            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-5 py-3 text-sm font-medium border-2 border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:outline-none transition-all shadow-md"
            >
              <option value="all">All Stores (Combined)</option>
              {ownedStores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* SALES TABLE */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'list' ? (
          <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <tr>
                {/* ADD STORE COLUMN FOR MULTI-STORE */}
                {isMultiStoreOwner && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    Store
                  </th>
                )}
                {['Product', 'Customer', 'Qty', 'Unit Price', 'Amount', 'Payment', 'IDs/Sizes', 'Date Sold', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={isMultiStoreOwner ? 10 : 9}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No sales found for the selected store.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* STORE NAME COLUMN */}
                    {isMultiStoreOwner && (
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {s.store_name || 'Unknown'}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.dynamic_product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {s.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-medium">
                      {s.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm">₦{formatCurrency(s.unit_price)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-700 dark:text-green-400">
                      ₦{formatCurrency(s.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        s.payment_method === 'Cash'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {s.deviceIds?.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openDetailModal(s)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium hover:underline"
                        >
                          View {s.deviceIds.length} ID{s.deviceIds.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(s.sold_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => onEdit(s, idx)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors edit-button"
                        title="Edit sale"
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* DAILY / WEEKLY TOTALS TABLE */
          <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTotals.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm font-medium">{t.period}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-700 dark:text-green-400">
                    ₦{formatCurrency(t.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}