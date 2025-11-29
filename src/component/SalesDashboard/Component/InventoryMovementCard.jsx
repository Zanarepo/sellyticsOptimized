// src/components/SalesDashboard/Component/InventoryMovementCard.jsx
import React from "react";

export default function InventoryMovementCard({ restockMetrics, loading }) {
  if (loading) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow animate-pulse border border-gray-200 dark:border-gray-700 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-xl">
              <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-3"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restockMetrics) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-12">
        No restock data available yet.
      </div>
    );
  }

  const {
    avgRestockPerProduct = 0,
    mostRestocked = null,
    leastRestocked = null,
  } = restockMetrics;

  const avg = Number(avgRestockPerProduct).toFixed(1);


  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      {/* Wide Horizontal Card */}
      <div
        className="p-8 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50
                   dark:from-indigo-900/40 dark:via-blue-900/30 dark:to-cyan-900/20
                   rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-800"
      >
        <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 text-center mb-8">
          Inventory Restock Insights
        </h3>
  
        {/* Fluid Grid: dynamic width */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
  
          {/* Average Restock Size */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                          transition transform   border-t-4 border-t-blue-500 hover:-translate-y-1 text-center">
            <h2 className="text-base font-semibold  text-gray-700 dark:text-gray-300">
              Avg Restock Size
            </h2>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {avg}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              units per restock
            </p>
          </div>
  
          {/* Most Restocked Product */}
          <div className="bg-white border-t-4 border-t-green-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                          transition transform hover:-translate-y-1 text-center">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Most Restocked
            </h2>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300 mt-1 line-clamp-2 min-h-[3rem] flex items-center justify-center">
              {mostRestocked?.productName || "N/A"}
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {mostRestocked?.quantity?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              units total
            </p>
          </div>
  
          {/* Least Restocked Product */}
          <div className="bg-white border-t-4 border-t-red-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                          transition transform hover:-translate-y-1 text-center">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Rarely Restocked
            </h2>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-300 mt-1 line-clamp-2 min-h-[3rem] flex items-center justify-center">
              {leastRestocked?.productName || "N/A"}
            </p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
              {leastRestocked?.quantity?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              units total
            </p>
          </div>
  
          {/* Add more cards */}
        
        </div>
  
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Based on all restock events in the selected period
        </div>
      </div>
    </div>
  );
  
  
}  