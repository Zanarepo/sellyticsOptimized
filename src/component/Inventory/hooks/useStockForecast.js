// src/inventory/hooks/useStockForecast.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useStockForecast(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState(null);

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      // Fetch inventory quantity
      const { data: inv } = await supabase
        .from("dynamic_inventory")
        .select("quantity")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId)
        .single();

      // Fetch last 30 days sales
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: sales } = await supabase
        .from("dynamic_sales")
        .select("quantity, sold_at")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId)
        .gte("sold_at", since.toISOString());

      if (inv && sales) {
        const totalQty = sales.reduce((a, s) => a + s.quantity, 0);
        const dailyAvg = totalQty / 30;
        const daysLeft = dailyAvg > 0 ? inv.quantity / dailyAvg : Infinity;

        setForecastDays(Math.round(daysLeft));
      }

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, forecastDays };
}
