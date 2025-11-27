// src/components/products/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toastError, toastSuccess } from './toastError';
import { formatCurrency } from './formatCurrency';

export const useProducts = (storeId) => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(false);

  // ---------- FETCH ----------
  const fetchProducts = useCallback(async () => {
    if (!storeId) return toastError('Store ID missing');
    try {
      const { data, error } = await supabase
        .from('dynamic_product')
        .select(`
          id, name, description, purchase_price, purchase_qty,
          selling_price, suppliers_name, device_id, device_size,
          is_unique, created_at, dynamic_product_imeis
        `)
        .eq('store_id', storeId)
        .order('id', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(p => ({
        ...p,
        is_unique: p.is_unique ?? false,
        deviceList: p.is_unique
          ? (p.dynamic_product_imeis?.split(',').filter(Boolean) ?? [])
          : [],
        sizeList: p.is_unique
          ? (p.device_size?.split(',').filter(Boolean) ?? [])
          : [],
        device_id: !p.is_unique ? p.device_id : null,
        device_size: !p.is_unique ? p.device_size : null,
        purchase_qty: p.purchase_qty ?? 0,
      }));

      setProducts(mapped);
      setFiltered(mapped);
    } catch (e) {
      toastError('Failed to load products');
    }
  }, [storeId]);

  // ---------- SEARCH ----------
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) return setFiltered(products);
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.deviceList.some(id => id.toLowerCase().includes(q)) ||
        p.sizeList.some(s => s.toLowerCase().includes(q))
      )
    );
  }, [search, products]);

  // ---------- CREATE ----------
  const createProducts = async (payload) => {
    try {
      const { data: prods, error } = await supabase
        .from('dynamic_product')
        .insert(payload)
        .select('id, is_unique, dynamic_product_imeis, device_id, purchase_qty');
      if (error) throw error;

      const invUpserts = prods.map(p => ({
        dynamic_product_id: p.id,
        store_id: storeId,
        available_qty: p.purchase_qty,
        quantity_sold: 0,
        last_updated: new Date().toISOString(),
      }));
      await supabase.from('dynamic_inventory').upsert(invUpserts, {
        onConflict: ['dynamic_product_id', 'store_id'],
      });

      toastSuccess('Products added');
      setRefresh(v => !v);
    } catch (e) {
      toastError(e.message ?? 'Failed to add products');
      throw e;
    }
  };

  // ---------- UPDATE (FIXED: PRESERVES quantity_sold) ----------
  const updateProduct = async (id, changes, inventoryDelta) => {
    try {
      // Step 1: Update product details
      const { error: prodErr } = await supabase
        .from('dynamic_product')
        .update(changes)
        .eq('id', id);
      if (prodErr) throw prodErr;
  
      // Step 2: Only update inventory if delta ≠ 0
      if (inventoryDelta !== 0) {
        const { data: inv, error: fetchErr } = await supabase
          .from('dynamic_inventory')
          .select('available_qty, quantity_sold')
          .eq('dynamic_product_id', id)
          .eq('store_id', storeId)
          .maybeSingle();
  
        if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;
  
        const currentAvailable = inv?.available_qty ?? 0;
        const currentSold = inv?.quantity_sold ?? 0;
  
        const newAvailable = Math.max(0, currentAvailable + inventoryDelta);
  
        const { error: invErr } = await supabase
          .from('dynamic_inventory')
          .upsert(
            {
              dynamic_product_id: id,
              store_id: storeId,
              available_qty: newAvailable,
              quantity_sold: currentSold,  // ← NEVER resets
              last_updated: new Date().toISOString(),
            },
            { onConflict: ['dynamic_product_id', 'store_id'] }
          );
  
        if (invErr) throw invErr;
      }
  
      toastSuccess('Product updated successfully');
      setRefresh(v => !v);
    } catch (e) {
      toastError(e.message ?? 'Failed to update product');
      throw e;
    }
  };
  
  // ---------- DELETE ----------
  const deleteProduct = async (id) => {
    try {
      await supabase.from('dynamic_product').delete().eq('id', id);
      await supabase
        .from('dynamic_inventory')
        .delete()
        .eq('dynamic_product_id', id)
        .eq('store_id', storeId);
      toastSuccess('Product deleted');
      setRefresh(v => !v);
    } catch (e) {
      toastError(e.message ?? 'Failed to delete product');
    }
  };

  // ---------- SOLD STATUS ----------
  const checkSoldDevices = async (ids) => {
    if (!ids?.length) return [];
    const { data, error } = await supabase
      .from('dynamic_sales')
      .select('device_id')
      .in('device_id', ids);
    if (error) throw error;
    return data.map(i => i.device_id);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refresh]);

  return {
    products,
    filtered,
    search,
    setSearch,
    fetchProducts,
    createProducts,
    updateProduct,
    deleteProduct,
    checkSoldDevices,
    formatCurrency,
  };
};