// src/inventory/hooks/useTopCustomers.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useTopCustomers(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("dynamic_sales")
        .select(
          "customer_id, customer_name, created_by_user_id, quantity, amount"
        )
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId);

      if (!error) {
        const map = {};

        data.forEach((sale) => {
          const key = sale.customer_id || sale.customer_name || "N/A";
          if (!map[key]) {
            map[key] = {
              customer_id: sale.customer_id,
              customer_name: sale.customer_name,
              created_by_user_id: sale.created_by_user_id,
              total_amount: 0,
              total_qty: 0,
            };
          }

          map[key].total_amount += Number(sale.amount);
          map[key].total_qty += sale.quantity;
        });

        setCustomers(
          Object.values(map).sort((a, b) => b.total_amount - a.total_amount)
        );
      }

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, customers };
}
