// components/Expense/ExpDetailedModal.jsx
import React from 'react';
import {
  FaTimes,
  FaCalendarAlt,     // Valid
  FaTag,            // Valid
  FaFileAlt,        // Valid (for notes)
  FaMoneyBillWave,  // Valid (perfect for expenses)
  FaReceipt         // Alternative for money (also valid)
} from 'react-icons/fa';

export default function ExpDetailedModal({ expense, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white  text-red-500 p-8 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-extrabold flex items-center gap-3">
                <FaMoneyBillWave className="text-4xl" />
                Expense Details
              </h2>
              <p className="text-xl mt-2 opacity-90">{expense.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-3 rounded-full transition"
            >
              <FaTimes size={26} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FaCalendarAlt /> Date
              </p>
              <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
  {new Date(expense.expense_date).toLocaleDateString('en-NG')}
</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <FaReceipt /> Amount Spent
              </p>
              <p className="text-4xl font-extrabold text-red-600 dark:text-red-400 mt-2">
                ₦{Number(expense.amount).toLocaleString('en-NG')}
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <FaTag /> Category
            </p>
            <p className="text-2xl font-bold capitalize text-indigo-700 dark:text-indigo-300 mt-2">
              {expense.category}
            </p>
          </div>

          {/* Note */}
          {expense.note && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FaFileAlt /> Note
              </p>
              <p className="text-lg italic mt-2 text-gray-800 dark:text-gray-200 leading-relaxed">
                "{expense.note}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transform hover:scale-105 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}