import React from "react";

export default function SalesSummaryCard({ metrics }) {
  if (!metrics) return null;

  const { totalRevenue, avgDailySales, topCustomers, bestSellingHours } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Total Revenue</h3>
        <p>{metrics.formatCurrency(totalRevenue)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Average Daily Sales</h3>
        <p>{metrics.formatCurrency(avgDailySales)}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Top Spending Customers</h3>
        <ul className="list-disc pl-5 text-sm">
          {topCustomers?.slice(0, 3).map(c => (
            <li key={c.customerId}>{c.customerName} ({metrics.formatCurrency(c.revenue)})</li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Best Selling Hours</h3>
        <ul className="list-disc pl-5 text-sm">
          {bestSellingHours?.slice(0, 3).map(h => (
            <li key={h.hour}>{h.hour}:00 ({h.quantity})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
