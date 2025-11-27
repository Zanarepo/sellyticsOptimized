// src/inventory/hooks/useStockLife.js
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { toast } from "react-toastify";

/**
 * Hook to calculate average stock-life and restocking frequency
 */
export function useStockLife(productId, storeId) {
  const [data, setData] = useState({
    avgStockLifeDays: 0,
    restockFrequency: 0, // times restocked per month
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !storeId) return;

    const fetchStockLife = async () => {
      setLoading(true);
      try {
        // Get inventory adjustments for this product
        const { data: adjustments, error } = await supabase
          .from("product_inventory_adjustments_logs")
          .select("old_quantity, new_quantity, created_at")
          .eq("dynamic_product_id", productId)
          .eq("store_id", storeId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (!adjustments || adjustments.length === 0) {
          setData({ avgStockLifeDays: 0, restockFrequency: 0 });
          return;
        }

        // Calculate avg stock-life
        let totalDays = 0;
        let restocks = 0;

        for (let i = 1; i < adjustments.length; i++) {
          const prev = new Date(adjustments[i - 1].created_at);
          const curr = new Date(adjustments[i].created_at);
          const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
          totalDays += diffDays;

          if (adjustments[i].new_quantity > adjustments[i].old_quantity) restocks++;
        }

        const avgStockLifeDays = totalDays / (adjustments.length - 1 || 1);
        const restockFrequency = restocks;

        setData({ avgStockLifeDays, restockFrequency });
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch stock-life data");
        setData({ avgStockLifeDays: 0, restockFrequency: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStockLife();
  }, [productId, storeId]);

  return { data, loading };
}
