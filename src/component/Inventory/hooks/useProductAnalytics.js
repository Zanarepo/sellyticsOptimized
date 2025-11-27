// src/inventory/hooks/useProductAnalytics.js
import useSalesTrends from "./useSalesTrends";
import useProfitability from "./useProfitability";
import useRestockHistory from "./useRestockHistory";
import useStockLife from "./useStockLife";
import useStockForecast from "./useStockForecast";
import useTopCustomers from "./useTopCustomers";

export default function useProductAnalytics(productId, storeId) {
  const salesTrends = useSalesTrends(productId, storeId);
  const profitability = useProfitability(productId, storeId);
  const restockHistory = useRestockHistory(productId, storeId);
  const stockLife = useStockLife(productId, storeId);
  const stockForecast = useStockForecast(productId, storeId);
  const topCustomers = useTopCustomers(productId, storeId);

  const loading =
    salesTrends.loading ||
    profitability.loading ||
    restockHistory.loading ||
    stockLife.loading ||
    stockForecast.loading ||
    topCustomers.loading;

  return {
    loading,
    salesTrends: salesTrends.salesTrends,
    profitability: profitability.profitData,
    restockHistory: restockHistory.restocks,
    stockLife: stockLife.avgStockLife,
    forecastDays: stockForecast.forecastDays,
    topCustomers: topCustomers.customers,
  };
}
