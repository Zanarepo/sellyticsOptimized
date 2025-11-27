import { useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-toastify';
import { canAdjustStock } from '../utils/permissions';
//import { getDynamicProducts, adjustStock } from '../utils/supabaseQueries';

/**
 * Hook for real-time inventory sync
 * @param {number} storeId - current store ID
 * @param {object} currentUser - logged-in user
 * @param {function} setInventory - setter from useInventory
 * @param {function} fetchProducts - fetch dynamic products
 */
export default function useInventorySync(storeId, currentUser, setInventory, fetchProducts) {
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`inventory-sync-${storeId}`)
      // Listen for new products inserted
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dynamic_product',
          filter: `store_id=eq.${storeId}`,
        },
        async ({ new: product }) => {
          console.log('New product received via real-time:', product);

          // Refresh product list
          if (fetchProducts) fetchProducts();

          // Optionally, you can seed inventory if needed here
          if (canAdjustStock(currentUser)) {
            toast.info(`New product added: ${product.name}`);
          }
        }
      )
      // Listen for product updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dynamic_product',
          filter: `store_id=eq.${storeId}`,
        },
        async ({ new: product }) => {
          console.log('Product updated via real-time:', product);

          // Refresh products list
          if (fetchProducts) fetchProducts();

          // Update inventory available_qty if necessary
          setInventory((prev) =>
            prev.map((item) =>
              item.dynamic_product_id === product.id
                ? { ...item, dynamic_product: product }
                : item
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Inventory sync subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
      console.log('Unsubscribed from inventory-sync channel');
    };
  }, [storeId, currentUser, setInventory, fetchProducts]);
}
