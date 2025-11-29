// src/components/SalesDashboard/Component/SalesSummaryCard.jsx
import React from "react";
import { useCurrency } from "../hooks/useCurrency";

export default function SalesSummaryCard({ metrics }) {
  const { formatCurrency } = useCurrency();

  if (!metrics) return null;

  const bestHour = metrics.bestSellingHours?.reduce(
    (max, h) => (h.total > max.total ? h : max),
    { hour: null, total: 0 }
  ) || { hour: null, total: 0 };

  const last30Total = metrics.last30Days?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;

  const top3Sold = (metrics.mostSoldItems || [])
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);



return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      <div
        className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50
                   dark:from-indigo-900/40 dark:via-blue-900/30 dark:to-cyan-900/20
                   rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-800"
      >
        <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 text-center mb-8">
          Sales Summary
        </h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    
    {/* Total Revenue */}
    <div className="bg-white border-t-4 border-t-indigo-400 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Total Revenue
      </h2>
      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
        {formatCurrency(metrics.totalRevenue || 0)}
      </p>
    </div>

    {/* Avg Daily Sales */}
    <div className="bg-white  border-t-4 border-t-emerald-300 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Avg Daily Sales
      </h2>
      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1 truncate">
        {formatCurrency(metrics.avgDailySales || 0)}
      </p>
    </div>

    {/* Fastest Moving */}
    <div className="bg-white border-t-4 border-t-amber-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Fastest Moving
      </h2>
      <p className="text-sm font-bold text-amber-600 dark:text-amber-300 mt-1 line-clamp-2">
        {metrics.fastestMovingItem?.productName || "N/A"}
      </p>
      <p className="text-3xl font-bold text-amber-700 dark:text-amber-200 mt-1">
        {metrics.fastestMovingItem?.quantity || 0}
      </p>
    </div>

    {/* Top Customer */}
    <div className="bg-white border-t-4 border-t-pink-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Top Customer
      </h2>
      <p className="text-sm font-bold text-pink-600 dark:text-pink-300 mt-1 line-clamp-2">
        {metrics.topCustomers?.[0]?.customerName || "N/A"}
      </p>
      <p className="text-3xl font-bold text-pink-700 dark:text-pink-200 mt-1">
        {formatCurrency(metrics.topCustomers?.[0]?.total || 0)}
      </p>
    </div>

    {/* Peak Hour */}
    <div className="bg-white border-t-4 border-t-cyan-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Peak Hour
      </h2>
      <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300 mt-1">
        {bestHour.hour !== null ? `${bestHour.hour}:00` : "—"}
      </p>
      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
        {bestHour.hour !== null ? formatCurrency(bestHour.total) : "No data"}
      </p>
    </div>

    {/* Last 30 Days */}
    <div className="bg-white border-t-4 border-t-purple-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Last 30 Days
      </h2>
      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
        {formatCurrency(last30Total)}
      </p>
    </div>

    {/* Slowest Moving */}
    <div className="bg-white border-t-4 border-t-rose-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Slowest Moving
      </h2>
      <p className="text-sm font-bold text-rose-600 dark:text-rose-300 mt-1 line-clamp-2">
        {metrics.slowestMovingItem?.productName || "N/A"}
      </p>
      <p className="text-3xl font-bold text-rose-700 dark:text-rose-200 mt-1">
        {metrics.slowestMovingItem?.quantity || 0}
      </p>
    </div>

    {/* Top 3 Best Sellers */}
    <div className="bg-white  border-t-4 border-t-fuchsia-500 dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg
                    transition transform hover:-translate-y-1 text-center w-full">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        Top 3 Best Sellers
      </h2>
      <ol className="mt-3 space-y-2 text-xs">
        {top3Sold.length > 0 ? (
          top3Sold.map((item, i) => (
            <li key={item.productId} className="flex justify-between items-center font-medium
                                               text-fuchsia-700 dark:text-fuchsia-300">
              <span className="truncate pr-2">
                {i + 1}. {item.productName}
              </span>
              <span className="font-bold text-lg text-fuchsia-800 dark:text-fuchsia-200">
                {item.quantity}
              </span>
            </li>
          ))
        ) : (
          <li className="text-center text-gray-500 dark:text-gray-400">No sales yet</li>
        )}
      </ol>
    </div>
</div>
  </div>
</div>

    )
  }    