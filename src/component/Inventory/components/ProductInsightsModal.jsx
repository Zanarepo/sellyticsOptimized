import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-toastify';

export default function ProductInsightsModal({ product, onClose }) {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isStoreOwner, setIsStoreOwner] = useState(false);

  const PAGE_SIZE = 20;

  const userEmail = localStorage.getItem('user_email');
  const storeId = localStorage.getItem('store_id');

  // Get product ID safely
  const productId = product?.dynamic_product?.id || product?.dynamic_product_id;

  // FETCH ADJUSTMENTS — Properly memoized with useCallback
  const fetchAdjustments = useCallback(async () => {
    if (!productId) return;

    setLoading(true);

    const { data, error, count } = await supabase
      .from('product_inventory_adjustments_logs')
      .select(
        `
        id,
        old_quantity,
        new_quantity,
        reason,
        created_at,
        updated_by,
        store_users ( email_address )
      `,
        { count: 'exact' }
      )
      .eq('dynamic_product_id', productId)
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load history');
      console.error('Supabase error:', error);
      setAdjustments([]);
      setTotalCount(0);
    } else {
      const formatted = (data || []).map(log => ({
        id: log.id,
        reason: log.reason || 'No reason provided',
        oldQty: log.old_quantity,
        newQty: log.new_quantity,
        difference: log.new_quantity - log.old_quantity,
        performedBy: log.store_users?.email_address || 'Unknown user',
        date: new Date(log.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      setAdjustments(formatted);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [productId, page]); // Dependencies are stable

  // Fetch on mount + page/product change
  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // Check if current user is store owner
  const checkStoreOwner = useCallback(async () => {
    if (!storeId || !userEmail) return;

    const { data } = await supabase
      .from('stores')
      .select('email_address')
      .eq('id', storeId)
      .single();

    setIsStoreOwner(data?.email_address === userEmail);
  }, [storeId, userEmail]);

  useEffect(() => {
    checkStoreOwner();
  }, [checkStoreOwner]);

  // Filtered results
  const filteredAdjustments = useMemo(() => {
    if (!searchTerm.trim()) return adjustments;
    const term = searchTerm.toLowerCase();
    return adjustments.filter(log =>
      log.reason.toLowerCase().includes(term) ||
      log.performedBy.toLowerCase().includes(term)
    );
  }, [adjustments, searchTerm]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Clear all logs (only owner)
  const handleClearHistory = async () => {
    if (!window.confirm('Delete ALL adjustment history for this product? This cannot be undone.')) return;

    const { error } = await supabase
      .from('product_inventory_adjustments_logs')
      .delete()
      .eq('dynamic_product_id', productId);

    if (error) {
      toast.error('Failed to clear history');
    } else {
      toast.success('History cleared');
      setAdjustments([]);
      setTotalCount(0);
      setPage(1);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh]  overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {product.dynamic_product?.name || 'Product'} – Adjustment History
            </h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Current Stock: <strong>{product.available_qty}</strong> • Sold: <strong>{product.quantity_sold ?? 0}</strong>
            </div>
          </div>
          <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="p-6 space-y-6">

          {/* Search + Clear */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <input
              type="text"
              placeholder="Search reason or user..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="px-5 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isStoreOwner && (
              <button
                onClick={handleClearHistory}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
              >
                Clear All History
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAdjustments.length} of {totalCount} records
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-500">Loading history...</div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-lg">No adjustment history found.</div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Reason</th>
                      <th className="p-4 text-right">Old</th>
                      <th className="p-4 text-right">New</th>
                      <th className="p-4 text-right font-bold">± Change</th>
                      <th className="p-4 text-left">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAdjustments.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="p-4 text-xs text-gray-600 dark:text-gray-400">{log.date}</td>
                        <td className="p-4 font-medium max-w-xs" title={log.reason}>
                          {log.reason}
                        </td>
                        <td className="p-4 text-right">{log.oldQty}</td>
                        <td className="p-4 text-right font-semibold">{log.newQty}</td>
                        <td className={`p-4 text-right font-bold text-lg ${
                          log.difference > 0 ? 'text-green-600' : log.difference < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {log.difference > 0 ? '+' : ''}{log.difference}
                        </td>
                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{log.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                  >
                    Previous
                  </button>
                  <span className="text-lg font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}