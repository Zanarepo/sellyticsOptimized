// src/inventory/utils/profitabilityUtils.js

/**
 * Calculates revenue, cost, profit, and margin
 */
export function computeProfitability(sales, purchasePrice) {
  let revenue = 0;
  let cost = 0;

  sales.forEach((s) => {
    revenue += Number(s.amount);
    cost += Number(s.quantity) * Number(purchasePrice);
  });

  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    totalRevenue: revenue,
    totalCost: cost,
    totalProfit: profit,
    margin,
  };
}
