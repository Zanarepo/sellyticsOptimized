// src/inventory/hooks/useProductCustomers.js
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { toast } from "react-toastify";

/**
 * Hook to fetch top customers and sales creators for a product
 */
export function useProductCustomers(productId, storeId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !storeId) return;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const { data: sales, error } = await supabase
          .from("dynamic_sales")
          .select(`
            id,
            quantity,
            amount,
            sold_at,
            customer_name,
            created_by_user_id,
            created_by_owner_id,
            dynamic_product_id
          `)
          .eq("dynamic_product_id", productId)
          .eq("store_id", storeId)
          .order("sold_at", { ascending: false });

        if (error) throw error;

        const formatted = sales.map((s) => ({
          id: s.id,
          quantity: s.quantity,
          amount: s.amount,
          customer: s.customer_name || "Unknown",
          soldAt: s.sold_at,
          createdByUserId: s.created_by_user_id,
          createdByOwnerId: s.created_by_owner_id,
        }));

        setData(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch product customer data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [productId, storeId]);

  return { data, loading };
}
