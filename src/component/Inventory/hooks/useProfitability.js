// src/inventory/hooks/useProfitability.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useProfitability(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    margin: 0,
  });

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      // Fetch product cost (from dynamic_product)
      const { data: product, error: productErr } = await supabase
        .from("dynamic_product")
        .select("purchase_price")
        .eq("id", productId)
        .single();

      if (productErr) return setLoading(false);

      const { purchase_price } = product;

      // Fetch its sales
      const { data: sales, error } = await supabase
        .from("dynamic_sales")
        .select("quantity, amount")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId);

      if (!error) {
        let revenue = 0;
        let cost = 0;

        sales.forEach((s) => {
          revenue += Number(s.amount);
          cost += Number(s.quantity) * Number(purchase_price);
        });

        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        setProfitData({
          totalRevenue: revenue,
          totalCost: cost,
          totalProfit: profit,
          margin,
        });
      }

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, profitData };
}
