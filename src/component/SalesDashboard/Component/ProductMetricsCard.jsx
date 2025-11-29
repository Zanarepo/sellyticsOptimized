import React from "react";

export default function ProductMetricsCard({ metrics }) {
  if (!metrics) return null;

  const { fastestMovingItem, slowestMovingItem, mostSoldItems } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Fastest Moving Item</h3>
        <p>{fastestMovingItem?.productName || "-"}</p>
        <p className="text-gray-500">{fastestMovingItem?.quantity || 0} sold</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Slowest Moving Item</h3>
        <p>{slowestMovingItem?.productName || "-"}</p>
        <p className="text-gray-500">{slowestMovingItem?.quantity || 0} sold</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Most Sold Items</h3>
        <ul className="list-disc pl-5 text-sm">
          {mostSoldItems?.slice(0, 5).map((item) => (
            <li key={item.productId}>
              {item.productName} ({item.quantity})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
