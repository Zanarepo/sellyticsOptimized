import React from 'react';

export default function RestockFrequencyCard({ frequency }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
      <h3 className="font-semibold mb-1">Restock Frequency</h3>
      <p className="text-lg font-bold">{frequency} times / month</p>
    </div>
  );
}
