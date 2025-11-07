import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

// Fetch VAT rate for a store
export const fetchVat = async (storeId) => {
  try {
    const { data, error } = await supabase
      .from('vat')
      .select('amount')
      .eq('store_id', storeId)
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('multiple (or no) rows returned')) {
        toast.warn('No VAT rate found, defaulting to 0%');
        return 0;
      }
      throw new Error(`Failed to fetch VAT: ${error.message}`);
    }
    return (data.amount || 0) / 100;
  } catch (error) {
    toast.error(`Failed to fetch VAT: ${error.message}, defaulting to 0%`);
    return 0;
  }
};