// src/components/SalesDashboard/hooks/useSalesData.js
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

export default function useSalesData() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) return;

    async function fetchSales() {
      setLoading(true);

      const { data, error } = await supabase
      .from("dynamic_sales")
      .select(`
        id,
        dynamic_product_id,
        quantity,
        unit_price,
        amount,
        sold_at,
        customer_id,
        dynamic_product(name),
        customer(id, fullname)  -- LEFT JOIN instead of INNER JOIN
      `)
      .eq("store_id", storeId)
      .order("sold_at", { ascending: false });
    

      if (!error && data) {
        const normalized = data.map((s) => ({
          id: s.id,
          productId: s.dynamic_product_id,
          productName: s.dynamic_product?.name ?? "Unknown",
          quantity: Number(s.quantity),
          unitPrice: Number(s.unit_price),
          totalSales: Number(s.amount),
          soldAt: new Date(s.sold_at),
          customerId: s.customer_id,
          customerName: s.customer?.fullname ?? "Anonymous", // ✅ use fullname from customer table
        }));

        setSales(normalized);
      } else {
        console.error(error);
      }

      setLoading(false);
    }

    fetchSales();
  }, []);

  return { sales, loading, setSales };
}
