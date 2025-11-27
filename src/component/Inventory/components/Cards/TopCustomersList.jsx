import React from 'react';

export default function TopCustomersList({ customers }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded shadow">
      <h3 className="font-semibold mb-2">Top Customers</h3>
      {customers.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No customers yet</p>
      ) : (
        <ul className="list-disc pl-5">
          {customers.map((c) => (
            <li key={c.customer_id}>
              {c.customer_name} - Qty: {c.totalQuantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
