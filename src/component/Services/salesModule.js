import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

// Fetch recent sales
export const fetchSales = async (storeId) => {
  if (!storeId) return [];
  try {
    const { data, error } = await supabase
      .from('sale_groups')
      .select(`
        id,
        total_amount,
        created_at,
        dynamic_sales (
          id,
          dynamic_product_id,
          quantity,
          unit_price,
          device_id,
          device_size,
          payment_method,
          customer_name
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      toast.error(`Failed to fetch sales: ${error.message}`);
      return [];
    }

    return data.map((group) => ({
      id: group.id,
      sale_group_id: group.id,
      total_amount: group.total_amount,
      created_at: group.created_at,
      items: group.dynamic_sales.map((sale) => ({
        dynamic_product_id: sale.dynamic_product_id,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        device_id: sale.device_id,
        device_size: sale.device_size,
        payment_method: sale.payment_method,
        customer_name: sale.customer_name,
      })),
    }));
  } catch (err) {
    toast.error(`Failed to fetch sales: ${err.message}`);
    return [];
  }
};

// Process a sale
export const processSale = async (cart, storeId, userId, selectedCustomerId, paymentMethod, vatRate, products, fetchSalesCallback) => {
  if (cart.length === 0) {
    toast.error('Cart is empty');
    return false;
  }

  try {
    // Validate inventory
    for (const item of cart) {
      const { data, error } = await supabase
        .from('dynamic_inventory')
        .select('available_qty')
        .eq('dynamic_product_id', item.dynamic_product_id)
        .eq('store_id', storeId)
        .single();
      if (error) throw new Error(`Failed to fetch inventory: ${error.message}`);

      if (data.available_qty < item.quantity) {
        const product = products.find((p) => p.id === item.dynamic_product_id);
        throw new Error(`Insufficient inventory for ${product?.name || 'Unknown'}: only ${data.available_qty} available`);
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    let customerName = null;
    if (selectedCustomerId) {
      const { data, error } = await supabase
        .from('customer')
        .select('fullname')
        .eq('id', selectedCustomerId)
        .single();
      if (error) throw new Error(`Failed to fetch customer: ${error.message}`);
      customerName = data?.fullname || 'Unknown';
    }

    const { data: group, error: groupError } = await supabase
      .from('sale_groups')
      .insert([{ store_id: storeId, total_amount: totalAmount, payment_method: paymentMethod, customer_id: selectedCustomerId }])
      .select('id')
      .single();
    if (groupError) throw new Error(`Sale group creation failed: ${groupError.message}`);

    const inserts = cart.map((item) => ({
      store_id: storeId,
      sale_group_id: group.id,
      dynamic_product_id: item.dynamic_product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      device_id: item.deviceIds.join(',') || null,
      device_size: item.deviceSizes.join(',') || null,
      payment_method: paymentMethod,
      customer_id: selectedCustomerId,
      customer_name: customerName,
      created_by_user_id: userId,
    }));

    const { error: salesError } = await supabase.from('dynamic_sales').insert(inserts);
    if (salesError) throw new Error(`Sales insertion failed: ${salesError.message}`);

    toast.success('Sale processed successfully!');
    fetchSalesCallback();
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};