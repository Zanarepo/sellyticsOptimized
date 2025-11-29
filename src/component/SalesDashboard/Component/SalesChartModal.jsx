// src/components/SalesChartModal.jsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesChartModal({ data = [], preferredCurrency, onClose }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: preferredCurrency.code,
      minimumFractionDigits: 2,
    }).format(value);

  // Aggregate sales by product
  const aggregatedData = useMemo(() => {
    const map = {};
    data.forEach((item) => {
      if (!map[item.productName]) {
        map[item.productName] = { 
          productName: item.productName, 
          totalSales: 0, 
          totalQty: 0, 
          transactions: 0 
        };
      }
      map[item.productName].totalSales += item.totalSales || 0;
      map[item.productName].totalQty += item.quantity || 0;
      map[item.productName].transactions += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.totalSales - a.totalSales); // sort descending by revenue
  }, [data]);

  // Top 5 products for summary
  const top5Products = aggregatedData.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sales by Product</h3>
          <button onClick={onClose} className="text-gray-700  dark:text-red-800 hover:text-gray-900">&times;</button>
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aggregatedData}>
            <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(val) => formatCurrency(val)} />
            <Bar dataKey="totalSales" fill="#6366F1" />
          </BarChart>
        </ResponsiveContainer>

        {/* Top 5 Product Performance Summary */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2 text-lg">Top 5 Products Performance</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {top5Products.map((p, idx) => (
              <li key={p.productName}>
                <strong>{idx + 1}. {p.productName}</strong> – 
                Total Revenue: {formatCurrency(p.totalSales)}, 
                Total Sold: {p.totalQty}, 
                Avg per Sale: {formatCurrency(p.totalSales / p.transactions)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
