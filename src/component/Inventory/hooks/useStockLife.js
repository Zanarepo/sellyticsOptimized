// src/inventory/hooks/useStockLife.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useStockLife(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [avgStockLife, setAvgStockLife] = useState(null);

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("dynamic_inventory")
        .select("created_at, updated_at, quantity")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId)
        .single();

      if (!error && data) {
        const created = new Date(data.created_at);
        const updated = new Date(data.updated_at || new Date());
        const lifeDays =
          (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        setAvgStockLife(Math.round(lifeDays));
      }

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, avgStockLife };
}
