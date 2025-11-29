import { useMemo } from "react";
import { groupBy, sum } from "../utils/salesCalculations";

export default function useProductMetrics(sales = []) {
  return useMemo(() => {
    if (!sales.length) return null;

    const grouped = groupBy(sales, s => s.productId);
    const products = Object.values(grouped).map(group => ({
      productId: group[0].productId,
      productName: group[0].productName,
      quantity: sum(group, s => s.quantity),
    }));

    const sorted = products.sort((a, b) => b.quantity - a.quantity);

    return {
      fastestMovingItem: sorted[0] || null,
      slowestMovingItem: sorted[sorted.length - 1] || null,
      mostSoldItems: sorted,
    };
  }, [sales]);
}
