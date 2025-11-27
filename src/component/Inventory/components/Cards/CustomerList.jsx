// src/inventory/components/Cards/CustomersList.jsx
import React from "react";
import { usePreferredCurrency } from "../../../../Hooks/usePreferredCurrency";

export default function CustomersList({ customers }) {
  const { formatCurrency } = usePreferredCurrency();

  if (!customers || customers.length === 0) {
    return <p className="mt-4 text-gray-500">No customer purchase data found.</p>;
  }

  return (
    <div className="p-6 bg-indigo-50 dark:bg-gray-900 rounded-2xl shadow-lg mt-6 border border-indigo-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-6 text-center">
        Top Customers
      </h3>

      <div className="space-y-4">
        {customers.map((c, index) => (
          <div
            key={c.customer_id || c.customer_name || index}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">
                  {c.customer_name || "N/A"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Qty sold: <strong>{c.total_qty}</strong>
                </p>
                {c.created_by_user_name && (  
                  <p className="text-xs text-gray-500 mt-1">
                    Sold by: {c.created_by_user_name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(c.total_amount)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
