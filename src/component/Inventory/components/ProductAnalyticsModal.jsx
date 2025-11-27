// ProductAnalyticsModal.jsx
import React from "react";
import useProductAnalytics from "../hooks/useProductAnalytics";
import SalesTrendChart from "../../Inventory/components/SalesTrendChart";
import ProfitabilityCard from "../../Inventory/components/Cards/ProfitabilityCard";
import ForecastCard from "../../Inventory/components/Cards/ForecastCard";
import CustomersList from "../../Inventory/components/Cards/CustomerList";

export default function ProductAnalyticsModal({ product, onClose }) {
  // ALL HOOKS FIRST — unconditionally!
  const {
    loading,
    salesTrends = [],
    profitability = {},
    restockHistory = [],
    stockLife = 0,
    forecastDays = 0,
    topCustomers = []
  } = useProductAnalytics(
    product?.dynamic_product_id ?? null,
    product?.store_id ?? localStorage.getItem("store_id") ?? null
  );

  // Hook must come BEFORE any return
  const chartData = React.useMemo(() => {
    if (!Array.isArray(salesTrends) || salesTrends.length === 0) {
      return [];
    }

    return salesTrends
      .map((item) => {
        const dateStr = item.date || item.sale_date || item.day || item.created_at;
        const qty = Number(item.total_sold || item.quantity_sold || item.qty || item.totalSold || 0);

        if (!dateStr || qty <= 0) return null;

        let label = "N/A";
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
        } catch (_) {
          label = String(dateStr).slice(5, 10).replace("-", "/");
        }

        return { day: label, qty };
      })
      .filter(Boolean)
      .reverse();
  }, [salesTrends]);

  // NOW safe to early return
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-5x2 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {product.dynamic_product?.name || "Product"} — Analytics
          </h2>
          <button onClick={onClose} className="text-3xl text-gray-500 hover:text-red-600">&times;</button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Sales Chart */}
            <div className="mb-8 bg-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-400">
                Sales Trend (Last 30 Days)
              </h3>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">No sales recorded in the last 30 days</p>
                </div>
              ) : (
                <div className="h-64">
                  <SalesTrendChart data={chartData} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <ProfitabilityCard data={profitability} />
              <ForecastCard
                stockLife={stockLife}
                forecastDays={forecastDays}
                restocks={restockHistory}
              />
            </div>

            <div className="mb-8">
            
              <CustomersList customers={topCustomers} />
            </div>
          </>
        )}

        <div className="flex justify-end pt-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}