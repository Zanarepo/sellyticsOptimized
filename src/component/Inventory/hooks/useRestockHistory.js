// src/inventory/hooks/useRestockHistory.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useRestockHistory(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [restocks, setRestocks] = useState([]);

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("product_inventory_adjustments_logs")
        .select("id, old_quantity, new_quantity, difference, reason, created_at")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId)
        .gt("difference", 0) // Only restocks
        .order("created_at", { ascending: false });

      if (!error) setRestocks(data);

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, restocks };
}
