import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import useInventorySync from './useInventorySync';
import useLowStock from './useLowStock';
import useInventorySearch from './useInventorySearch';
import usePagination from './usePagination';
import { getPreferences } from '../utils/inventoryPreferences';
import { toast } from 'react-toastify';

export default function useInventory() {
  const [storeId, setStoreId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canAdjust, setCanAdjust] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const preferences = getPreferences();

  // -------------------------
  // Initialize user and store
  // -------------------------
  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'));
    const email = localStorage.getItem('user_email');
    if (!sid || !email) {
      toast.error('No store ID or user email found in localStorage');
      return;
    }
    setStoreId(sid);
    setCurrentUser({ email });

    (async () => {
      try {
        // Check if store owner
        const { data: storeData, error: storeErr } = await supabase
          .from('stores')
          .select('email_address')
          .eq('id', sid)
          .single();

        if (storeErr) throw storeErr;

        if (storeData?.email_address === email) {
          setCanAdjust(true);
          setCanDelete(true);
          return;
        }

        // Check store_users table
        const { data: userData, error: userErr } = await supabase
          .from('store_users')
          .select('role')
          .eq('store_id', sid)
          .eq('email_address', email)
          .single();

        if (userErr && userErr.code !== 'PGRST116') throw userErr;

        if (userData) {
          const role = userData.role.toLowerCase();
          setCanAdjust(['store', 'manager', 'admin', 'MD'].includes(role));
          setCanDelete(['manager', 'admin', 'MD'].includes(role));
        }
      } catch (err) {
        console.error('Permission check failed:', err);
      }
    })();
  }, []);


  // -------------------------
  // Fetch inventory
  // -------------------------
  const fetchInventory = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select(`
        id,
        dynamic_product_id,
        available_qty,
        quantity_sold,
        dynamic_product (
          id,
          name,
          purchase_qty
        )
      `)
      .eq('store_id', storeId);

    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    if (storeId) fetchInventory();
  }, [storeId, fetchInventory]);

  // -------------------------
  // Real-time sync
  // -------------------------
  useInventorySync(storeId, currentUser, setInventory, fetchInventory);

  // -------------------------
  // Low stock
  // -------------------------
  const lowStockItems = useLowStock(inventory, preferences.lowStockThreshold, preferences.sortBy);

  // -------------------------
  // Search
  // -------------------------
  const { searchTerm, setSearchTerm, filteredInventory } = useInventorySearch(inventory);

  // -------------------------
  // Pagination
  // -------------------------
  const { page,  totalPages, paginatedItems, nextPage, prevPage, goToPage } =
    usePagination(filteredInventory, preferences.itemsPerPage);

  // Return everything
  return {
    storeId,
    inventory,
    loading,
    fetchInventory, 
    lowStockItems,
    searchTerm,
    setSearchTerm,
    filteredInventory,
    paginatedItems,
    page,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    canAdjust,
    canDelete,
  };
}
