import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

// Fetch all products for a store
export const fetchProducts = async (storeId) => {
  if (!storeId) return [];
  try {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price, dynamic_product_imeis, device_id, device_size')
      .eq('store_id', storeId)
      .order('name');
    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      return [];
    }
    return (data || []).map((p) => ({
      ...p,
      deviceIds: p.device_id ? p.device_id.split(',').filter((id) => id.trim()) : [],
      deviceSizes: p.device_size ? p.device_size.split(',').filter((size) => size.trim()) : [],
    }));
  } catch (err) {
    toast.error(`Failed to fetch products: ${err.message}`);
    return [];
  }
};

// Search products by name or device ID
export const searchProducts = async (storeId, query) => {
  if (!storeId || !query) return [];
  try {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price, dynamic_product_imeis, device_id, device_size')
      .eq('store_id', storeId)
      .or(`name.ilike.%${query}%,device_id.ilike.%${query}%`)
      .order('name');
    if (error) {
      toast.error(`Failed to search products: ${error.message}`);
      return [];
    }
    return (data || []).map((p) => ({
      ...p,
      deviceIds: p.device_id ? p.device_id.split(',').filter((id) => id.trim()) : [],
      deviceSizes: p.device_size ? p.device_size.split(',').filter((size) => size.trim()) : [],
    }));
  } catch (err) {
    toast.error(`Failed to search products: ${err.message}`);
    return [];
  }
};