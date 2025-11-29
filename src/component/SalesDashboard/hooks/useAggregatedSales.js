// src/components/SalesDashboard/hooks/useAggregatedSales.js
import { useMemo, useState } from "react";
import { aggregateSales } from "../utils/aggregateSales";

/**
 * Hook to provide aggregated sales data with filtering options
 * @param {Array} salesData - Array of sales objects
 * @returns {Object}
 */
export function useAggregatedSales(salesData = []) {
  const [filterPeriod, setFilterPeriod] = useState("monthly"); // "daily" | "weekly" | "monthly"

  // Memoized aggregation
  const aggregated = useMemo(() => aggregateSales(salesData), [salesData]);

  // Function to get totals per product for selected period
  const getProductTotals = (productId) => {
    if (!productId || !aggregated.byProduct[productId]) return {};
    const productData = aggregated.byProduct[productId];
    return productData[filterPeriod] || {};
  };

  // Function to get totals for all products aggregated by period
  const getAllTotals = () => {
    const totals = {};
    Object.keys(aggregated.byProduct).forEach((productId) => {
      totals[productId] = aggregated.byProduct[productId][filterPeriod] || {};
    });
    return totals;
  };

  return {
    filterPeriod,
    setFilterPeriod,
    aggregated,
    getProductTotals,
    getAllTotals,
  };
}
