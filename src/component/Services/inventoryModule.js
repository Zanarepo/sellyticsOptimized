import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

// Check inventory for a product
export const checkInventory = async (productId, quantityToAdd, storeId, products) => {
  try {
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select('available_qty')
      .eq('dynamic_product_id', productId)
      .eq('store_id', storeId)
      .single();
    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      return false;
    }

    const newQty = data.available_qty - quantityToAdd;
    if (newQty < 0) {
      const product = products.find((p) => p.id === productId);
      toast.error(`Insufficient inventory for ${product?.name || 'Unknown'}: only ${data.available_qty} available`);
      return false;
    }
    if (newQty <= 5) {
      const product = products.find((p) => p.id === productId);
      toast.warn(`Low inventory alert: ${product?.name || 'Unknown'} has only ${newQty} units remaining!`);
    }
    return true;
  } catch (err) {
    toast.error(err.message);
    return false;
  }
};