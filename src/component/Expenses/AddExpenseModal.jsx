// components/Expense/AddExpenseModal.jsx
import React, { useState } from 'react';
import { FaTimes, FaSave, FaPlus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Import react-toastify directly

const categories = [
  'Rent', 'Salary', 'Utilities', 'Transport', 'Supplies',
  'Marketing', 'Repairs', 'Food', 'Internet', 'Other'
];

export default function AddExpenseModal({ expense, onClose, onSuccess }) {
  const isEdit = !!expense?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'Other',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    note: expense?.note || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {

      // Only show success if no error was thrown
      toast.success(
        isEdit 
          ? 'Expense updated successfully!' 
          : 'Expense added successfully!'
      );

      onClose(); // Close modal
    } catch (err) {
      // Error already shown by useExpense hook
      console.error('Expense save failed:', err);
      // No need to show error here — useExpense already shows it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            {isEdit ? <FaSave className="text-green-600" /> : <FaPlus className="text-indigo-600" />}
            {isEdit ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-red-600 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-900 dark:border-gray-600 focus:ring-4 focus:ring-indigo-300 outline-none transition"
              placeholder="e.g. Shop Rent, Staff Salary"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-900 dark:border-gray-600 focus:ring-4 focus:ring-red-300 outline-none transition"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Date</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-900 dark:border-gray-600 outline-none transition"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-900 dark:border-gray-600 outline-none transition"
              disabled={isSubmitting}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Note (Optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-900 dark:border-gray-600 resize-none outline-none transition"
              placeholder="Any extra details..."
              disabled={isSubmitting}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 rounded-lg font-bold hover:bg-gray-400 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600  text-white rounded-lg font-bold hover:from-indigo-700 shadow-lg transform hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {isEdit ? 'Update Expense' : 'Add Expense'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}