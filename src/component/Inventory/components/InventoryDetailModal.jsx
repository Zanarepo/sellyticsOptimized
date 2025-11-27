import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-toastify';

export default function InventoryDetailModal({ 
  product, 
  onClose, 
  fetchInventory,
  logInventoryChange 
}) {
  const [action, setAction] = useState('add'); // 'add' or 'reduce'
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const currentQty = product.available_qty;
  const amount = parseInt(qty, 10) || 0;
  const newQty = action === 'add' ? currentQty + amount : currentQty - amount;

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.warn('Please enter a valid quantity');
      return;
    }
    if (!reason.trim()) {
      toast.warn('Reason is required for all adjustments');
      return;
    }
    if (newQty < 0) {
      toast.error(`Cannot reduce below 0. Current: ${currentQty}`);
      return;
    }

    setLoading(true);

    try {
      // Update stock
      const { error } = await supabase
        .from('dynamic_inventory')
        .update({ available_qty: newQty })
        .eq('id', product.id);

      if (error) throw error;

      // Log change
      await logInventoryChange(product, currentQty, newQty, reason.trim());

      // Success
      const name = product.dynamic_product?.name || 'Product';
      toast.success(`${name}: ${currentQty} → ${newQty} (${action === 'add' ? '+' : '-'}${amount})`);

      fetchInventory();
      onClose();
    } catch (err) {
      console.error('Adjustment failed:', err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh]  overflow-y-auto">

        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            Adjust Stock
          </h2>
          <div className="text-5xl font-black text-gray-800 dark:text-white">
            {currentQty}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Current Stock • {product.dynamic_product?.name}</p>
        </div>

        {/* Add / Reduce Toggle */}
        <div className="flex justify-center gap-4 mb-8 px-8">
          <button
            onClick={() => setAction('add')}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-md ${
              action === 'add'
                ? 'bg-indigo-600 text-white shadow-indigo-500/50'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
            }`}
          >
            Add Stock
          </button>
          <button
            onClick={() => setAction('reduce')}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-md ${
              action === 'reduce'
                ? 'bg-red-600 text-white shadow-red-500/50'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
            }`}
          >
            Reduce Stock
          </button>
        </div>

        {/* Quantity */}
        <div className="px-8 mb-6">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={`Quantity to ${action === 'add' ? 'add' : 'remove'}`}
            className="w-full p-5 text-2xl font-bold text-center border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:border-indigo-500 focus:outline-none dark:bg-gray-800"
          />
        </div>

        {/* Reason — Always Required */}
        <div className="px-8 mb-6">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              action === 'add'
                ? 'Reason (required): Restock, Customer return, Found in warehouse...'
                : 'Reason (required): Damaged, Expired, Theft, Counting error...'
            }
            rows={3}
            className={`w-full p-5 text-lg rounded-2xl resize-none transition-all focus:ring-4
              ${
                action === 'add'
                  ? 'border-2 border-indigo-500 focus:border-indigo-600 focus:ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/20'
                  : 'border-2 border-red-500 focus:border-red-600 focus:ring-red-500/20 bg-red-50/30 dark:bg-red-900/20'
              }
              placeholder-gray-500 dark:bg-gray-800 dark:text-white
            `}
          />
        </div>

        {/* Preview */}
        {qty && reason && (
          <div className="text-center mb-8 px-8">
            <div className="text-5xl font-black">
              <span className={action === 'add' ? 'text-indigo-600' : 'text-red-600'}>
                {newQty}
              </span>
            </div>
            <div className="text-xl font-medium text-gray-600 dark:text-gray-400 mt-2">
              {action === 'add' ? '+' : '−'}{amount} units
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4 p-8 pt-4 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gray-300 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !qty || !reason.trim()}
            className={`px-10 py-4 rounded-xl font-bold text-white shadow-lg transition ${
              action === 'add'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Saving...' : action === 'add' ? `Add ${qty} Units` : `Remove ${qty} Units`}
          </button>
        </div>
      </div>
    </div>
  );
}