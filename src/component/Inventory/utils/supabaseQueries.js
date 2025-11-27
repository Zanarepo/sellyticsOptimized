// src/inventory/utils/supabaseQueries.js
import { supabase } from '../../../supabaseClient';

// ------------------------------
// INVENTORY
// ------------------------------

export async function getInventory(storeId = null) {
  let query = supabase
    .from('dynamic_inventory')
    .select(`
      *,
      dynamic_product(id, name, purchase_qty),
      stores(id, shop_name)
    `)
    .order('id', { ascending: false });

  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }

  return handleResponse(query);
}

export async function getInventoryItem(id) {
  const query = supabase
    .from('dynamic_inventory')
    .select(`
      *,
      dynamic_product(id, name, purchase_qty),
      stores(id, shop_name)
    `)
    .eq('id', id)
    .single();

  return handleResponse(query);
}

export async function insertInventoryItem(data) {
  const query = supabase.from('dynamic_inventory').insert(data).select().single();
  return handleResponse(query);
}

export async function updateInventoryItem(id, updates) {
  const query = supabase
    .from('dynamic_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return handleResponse(query);
}

export async function deleteInventoryItem(id) {
  const query = supabase.from('dynamic_inventory').delete().eq('id', id);
  return handleResponse(query);
}

// ------------------------------
// PRODUCTS
// ------------------------------

export async function getDynamicProducts(storeId = null) {
  let query = supabase.from('dynamic_product').select('*').order('name');

  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }

  return handleResponse(query);
}

// ------------------------------
// STOCK MANAGEMENT
// ------------------------------

export async function adjustStock(itemId, qtyChange, userId, reason = 'update') {
  // Step 1: Fetch current record
  const { data: item, error: fetchError } = await supabase
    .from('dynamic_inventory')
    .select('available_qty, dynamic_product_id, store_id')
    .eq('id', itemId)
    .single();

  if (fetchError) return { error: fetchError };

  const newQty = item.available_qty + qtyChange;

  // Step 2: Update inventory
  const { error: updateError } = await supabase
    .from('dynamic_inventory')
    .update({ available_qty: newQty })
    .eq('id', itemId);

  if (updateError) return { error: updateError };

  // Step 3: Log stock movement
  await logStockMovement({
    dynamic_inventory_id: itemId,
    dynamic_product_id: item.dynamic_product_id,
    store_id: item.store_id,
    qty_change: qtyChange,
    new_quantity: newQty,
    updated_by: userId,
    reason,
  });

  return { success: true, newQty };
}

export async function logStockMovement(logData) {
  const query = supabase
    .from('product_inventory_adjustments_logs')
    .insert(logData)
    .select();

  return handleResponse(query);
}

// ------------------------------
// LOW STOCK
// ------------------------------

export async function getLowStockItems(storeId = null, threshold = 5) {
  let query = supabase
    .from('dynamic_inventory')
    .select(`
      *,
      dynamic_product(id, name, purchase_qty),
      stores(id, shop_name)
    `)
    .lte('available_qty', threshold)
    .order('available_qty', { ascending: true });

  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }

  return handleResponse(query);
}

// ------------------------------
// RESPONSE HANDLER
// ------------------------------

async function handleResponse(query) {
  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return { error };
  }

  return { data };
}
