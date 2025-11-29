// src/hooks/useRestockMetrics.js
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

export default function useRestockMetrics() {
  const [restockMetrics, setRestockMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      setLoading(false);
      return;
    }

    async function loadRestocks() {
      setLoading(true);

      // Try multiple possible sources — most common ones
      const queries = [
        // 1. Modern: dedicated restocks table
        supabase
          .from("restocks")
          .select("product_id, product:name, quantity, created_at")
          .eq("store_id", storeId),

        // 2. Common: inventory movements with type
        supabase
          .from("inventory_movements")
          .select("product_id, product:name, quantity, movement_type, created_at")
          .eq("store_id", storeId)
          .in("movement_type", ["restock", "receive", "adjustment_in"]),

        // 3. Your current table — fallback with manual diff
        supabase
          .from("product_inventory_adjustments_logs")
          .select(`
            dynamic_product_id,
            dynamic_product(name),
            old_quantity,
            new_quantity,
            difference,
            reason,
            created_at
          `)
          .eq("store_id", storeId),
      ];

      let rawData = null;

      // Try each query until one returns data
      for (const q of queries) {
        const { data, error } = await q;
        if (error) continue;
        if (data && data.length > 0) {
          rawData = data;
          console.log("Restock data found in:", q);
          break;
        }
      }

      if (!rawData || rawData.length === 0) {
        setRestockMetrics({
          avgRestockPerProduct: 0,
          mostRestocked: null,
          leastRestocked: null,
        });
        setLoading(false);
        return;
      }

      // Normalize all possible formats
      const restocks = rawData
        .map((r) => {
          let qty = 0;
          let productId = r.dynamic_product_id || r.product_id || r.product?.id;
          let productName = r.dynamic_product?.name || r.product?.name || "Unknown";

          if ("quantity" in r) {
            qty = Number(r.quantity) || 0;
          } else if (r.difference !== undefined && r.difference !== null) {
            qty = Number(r.difference);
          } else if (r.new_quantity != null && r.old_quantity != null) {
            qty = Number(r.new_quantity) - Number(r.old_quantity);
          }

          // Only count actual restocks (positive)
          if (qty <= 0) return null;

          return { productId, productName, quantity: qty };
        })
        .filter(Boolean);

      if (restocks.length === 0) {
        setRestockMetrics({
          avgRestockPerProduct: 0,
          mostRestocked: null,
          leastRestocked: null,
        });
        setLoading(false);
        return;
      }

      // Calculate metrics
      const byProduct = {};
      restocks.forEach((r) => {
        if (!byProduct[r.productId]) {
          byProduct[r.productId] = {
            name: r.productName,
            total: 0,
            count: 0,
          };
        }
        byProduct[r.productId].total += r.quantity;
        byProduct[r.productId].count += 1;
      });

      const products = Object.values(byProduct).map((p) => ({
        productId: Object.keys(byProduct).find((k) => byProduct[k] === p),
        productName: p.name,
        quantity: p.total,
        avgSize: p.total / p.count,
      }));

      const avgRestockPerProduct = restocks.reduce((a, r) => a + r.quantity, 0) / restocks.length;

      products.sort((a, b) => b.quantity - a.quantity);

      setRestockMetrics({
        avgRestockPerProduct: Math.round(avgRestockPerProduct * 10) / 10 || 0,
        mostRestocked: products[0] || null,
        leastRestocked: products[products.length - 1] || null,
      });

      setLoading(false);
    }

    loadRestocks();
  }, []);

  return { restockMetrics, loading };
}