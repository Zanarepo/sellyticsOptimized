// src/components/Expenses/ExpenseTable.jsx
import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const CURRENCY_STORAGE_KEY = "preferred_currency";

const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Pound Sterling" },
];

export default function ExpenseTable({ expenses, onView, onEdit, onDelete }) {
  const [currencySymbol, setCurrencySymbol] = useState("₦");

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    const found = SUPPORTED_CURRENCIES.find(c => c.code === stored);
    setCurrencySymbol(found?.symbol || "₦");
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((exp) => {
              const amount = Number(exp.amount || 0);

              return (
                <tr
                  key={exp.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 bg-red-50 dark:bg-red-900/20"
                >
                  {/* Date */}
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {exp.expense_date
                      ? new Date(exp.expense_date).toLocaleDateString('en-NG', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {exp.description || '—'}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      {exp.category || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Amount – Now uses dynamic symbol */}
                  <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                    {currencySymbol}{amount.toLocaleString('en-NG')}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4 text-lg">
                      <button
                        onClick={() => onView(exp)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => onEdit(exp)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition"
                        title="Edit Expense"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 transition"
                        title="Delete Expense"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {expenses.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-xl font-medium">No expenses recorded yet</p>
            <p className="text-sm mt-2">Click "Add Expense" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}