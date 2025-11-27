// src/inventory/hooks/useSalesTrends.js
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function useSalesTrends(productId, storeId) {
  const [loading, setLoading] = useState(true);
  const [salesTrends, setSalesTrends] = useState([]);

  useEffect(() => {
    if (!productId || !storeId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("dynamic_sales")
        .select("id, quantity, amount, sold_at")
        .eq("dynamic_product_id", productId)
        .eq("store_id", storeId)
        .order("sold_at", { ascending: true });

      if (!error && data?.length) {
        const byDay = {};

        data.forEach((sale) => {
          const day = sale.sold_at.split("T")[0];
          if (!byDay[day]) byDay[day] = { day, quantity: 0, amount: 0 };
          byDay[day].quantity += sale.quantity;
          byDay[day].amount += Number(sale.amount);
        });

        // Map quantity → qty for chart compatibility
        const mapped = Object.values(byDay).map(d => ({
          day: d.day,
          qty: d.quantity,
        }));

        setSalesTrends(mapped);
      } else {
        setSalesTrends([]);
      }

      setLoading(false);
    };

    load();
  }, [productId, storeId]);

  return { loading, salesTrends };
}
