import React from 'react';

export default function StockLifeCard({ avgLife, daysUntilStockOut }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow space-y-1">
      <h3 className="font-semibold">Stock Life</h3>
      <p>Avg: {avgLife} days</p>
      <p>Forecast Stock-Out: {daysUntilStockOut} days</p>
    </div>
  );
}
