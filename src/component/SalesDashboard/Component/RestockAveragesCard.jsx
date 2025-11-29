import React from "react";

export default function RestockAveragesCard({ restockMetrics }) {
  if (!restockMetrics) return null;

  const { avgRestockPerProduct } = restockMetrics;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
      <h3 className="font-semibold mb-2">Averages Restock per Product</h3>
      <p className="text-lg">{avgRestockPerProduct.toFixed(2)}</p>
    </div>
  );
}
