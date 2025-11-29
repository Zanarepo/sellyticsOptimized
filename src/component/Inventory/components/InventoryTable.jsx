import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-toastify';
import useInventory from '../hooks/useInventory';
import LowStockTable from './LowStockTable';
import InventoryControls from './InventoryControls';
import InventoryDetailModal from './InventoryDetailModal';
import ProductInsightsModal from './ProductInsightsModal';
import OnboardingTooltip from './OnboardingTooltip';
import ProductAnalyticsModal from './ProductAnalyticsModal';
import { FaEdit, FaTrashAlt, FaHistory } from 'react-icons/fa';

export default function InventoryTable() {
  const {
    storeId,
    loading,
    lowStockItems,
    searchTerm,
    setSearchTerm,
    paginatedItems,
    page,
    totalPages,
    nextPage,
    prevPage,
    canAdjust,
    canDelete,
    fetchInventory,
  } = useInventory();

  const [detailModalProduct, setDetailModalProduct] = useState(null);
  const [insightsModalProduct, setInsightsModalProduct] = useState(null);
  const [analyticsModalProduct, setAnalyticsModalProduct] = useState(null);

  // Get user ID from store_users using email
  const getCurrentUserId = async () => {
    const email = localStorage.getItem('user_email');
    if (!email) return null;

    try {
      const { data } = await supabase
        .from('store_users')
        .select('id')
        .eq('email_address', email)
        .single();
      return data?.id || null;
    } catch (err) {
      console.warn('Failed to fetch user ID for audit:', err.message);
      return null;
    }
  };

  const logInventoryChange = async (item, oldQty, newQty, reason = 'Manual adjustment') => {
    const storeId = localStorage.getItem('store_id');
    const userEmail = localStorage.getItem('user_email') || 'unknown';
  
    if (!storeId || !item?.id || oldQty === undefined || newQty === undefined) {
      console.error('Missing required data for logging:', { storeId, item, oldQty, newQty });
      toast.error('Cannot log change — missing data');
      return false;
    }
  
    try {
      const updatedBy = await getCurrentUserId();
  
      const productId = item.dynamic_product?.id || item.dynamic_product_id || null;
      const productName = item.dynamic_product?.name || 'Unknown Product';
  
      const logEntry = {
        dynamic_inventory_id: item.id,
        dynamic_product_id: productId,
        store_id: parseInt(storeId),
        old_quantity: oldQty,
        new_quantity: newQty,
        reason,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
        metadata: {
          source: 'inventory_manager',
          user_email: userEmail,
          product_name: productName,
          page: window.location.pathname,
        },
      };
  
      console.log('%cINSERTING LOG ENTRY:', 'color: orange; font-weight: bold;', logEntry);
  
      // THIS IS THE CORRECT WAY TO INSERT IN SUPABASE
      const { error } = await supabase
        .from('product_inventory_adjustments_logs')
        .insert([logEntry]); // ← MUST be an array!
  
      if (error) {
        console.error('%cLOG INSERT FAILED', 'color: red; font-size: 18px;', error);
        toast.error(`Log failed: ${error.message}`);
        return false;
      }
  
      // SUCCESS — no data returned, but no error = success
      console.log('%cLOG INSERTED SUCCESSFULLY', 'color: green; font-weight: bold;', {
        product: productName,
        from: oldQty,
        to: newQty,
        reason,
      });
  
      toast.success(`${productName}: ${oldQty} → ${newQty}`, { duration: 2500 });
      return true;
  
    } catch (err) {
      console.error('%cFATAL ERROR in logInventoryChange', 'color: red; font-size: 20px;', err);
      toast.error('Failed to log change — check console');
      return false;
    }
  };

  // Delete handler with full audit trail
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.dynamic_product?.name || 'this product'}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      // 1. Log deletion first
      await logInventoryChange(
        item,
        item.available_qty,
        0,
        `Product deleted permanently by user`
      );

      // 2. Delete from dynamic_inventory
      const { error: invError } = await supabase
        .from('dynamic_inventory')
        .delete()
        .eq('id', item.id);

      if (invError) throw invError;

      // 3. Delete the product itself
      const { error: prodError } = await supabase
        .from('dynamic_product')
        .delete()
        .eq('id', item.dynamic_product_id);

      if (prodError) throw prodError;

      toast.success(`"${item.dynamic_product?.name}" deleted permanently`);
      fetchInventory();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  if (!storeId) return <div className="p-4">Loading store...</div>;
  if (loading) return <div className="p-4">Loading inventory...</div>;

  return (
    <div className="space-y-6 p-4 dark:bg-gray-900 dark:text-white">
    
      <InventoryControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        lowStockItems={lowStockItems}
        canAdjust={canAdjust}
      />

      {lowStockItems.length > 0 && (
        <LowStockTable
          lowStockItems={lowStockItems}
          onProductClick={setDetailModalProduct}
          canAdjust={canAdjust}
        />
      )}

      <div className="overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-lg shadow">

  
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['ID', 'Product', 'Available', 'Sold', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm">{item.id}</td>
                  
                  <td
  className="px-4 py-3 font-medium cursor-pointer hover:underline text-indigo-600 dark:text-indigo-400"
  onClick={() => setAnalyticsModalProduct(item)}
>
  {item.dynamic_product?.name || 'Unknown'}
</td>


                  <td className="px-4 py-3">
                    <span className={item.available_qty <= (item.reorder_level || 0) ? 'text-red-600 font-bold' : ''}>
                      {item.available_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.quantity_sold ?? 0}</td>
                  <td className="px-4 py-3 space-x-2">
                    {canAdjust && (
                      <button
                        onClick={() => setDetailModalProduct(item)}
                        className="px-3 py-1.5  text-indigo-600 text-xs rounded hover:bg-indigo-100"
                      >
                      <FaEdit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-3 py-1.5 text-red-600 text-xs rounded hover:bg-red-100"
                      >
                      <FaTrashAlt className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setInsightsModalProduct(item)}
                      className="px-3 py-1.5  text-yellow-600 text-xs rounded hover:bg-yellow-100"
                    >
                    <FaHistory className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={prevPage} disabled={page === 0} className="px-5 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm font-medium">Page {page + 1} of {totalPages}</span>
          <button onClick={nextPage} disabled={page + 1 >= totalPages} className="px-5 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Pass the logger to the modal */}
      {detailModalProduct && (
        <InventoryDetailModal
          product={detailModalProduct}
          onClose={() => setDetailModalProduct(null)}
          fetchInventory={fetchInventory}
          logInventoryChange={logInventoryChange}
        />
      )}

      {insightsModalProduct && (
        <ProductInsightsModal
          product={insightsModalProduct}
          onClose={() => setInsightsModalProduct(null)}
        />
      )}


{       analyticsModalProduct && (
     <ProductAnalyticsModal
    product={analyticsModalProduct}
    onClose={() => setAnalyticsModalProduct(null)}
  />
)}
      <OnboardingTooltip />
    </div>
  );
}