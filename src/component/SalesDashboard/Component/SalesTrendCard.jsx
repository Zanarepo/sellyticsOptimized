import React from "react";

export default function SalesTrendCard({ last30Days = [], currency = "USD" }) {
  if (!last30Days || last30Days.length === 0) return null;

  // Sum total sales over last 30 days
  const totalSales = last30Days.reduce((sum, d) => sum + (d.total || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
      <h3 className="font-semibold mb-2">Sales in the Last 30 Days</h3>
      <p className="text-xl font-bold">
        {currency} {totalSales.toLocaleString()}
      </p>
    </div>
  );
}
