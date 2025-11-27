import React from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

export default function SalesTableWrapper({ viewMode, data, formatCurrency, onEdit, onDelete, openDetailModal }) {
  if (data.length === 0) return <p className="text-center text-gray-500 mt-10">No sales found</p>;

  return (
    <div className="overflow-x-auto mt-6">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {viewMode === 'list' ? (
              <>
                <th className="border px-4 py-2">Product</th>
                <th className="border px-4 py-2">Qty</th>
                <th className="border px-4 py-2">Price</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Payment</th>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Actions</th>
              </>
            ) : (
              <>
                <th className="border px-4 py-2">Period</th>
                <th className="border px-4 py-2">Total Sales</th>
                <th className="border px-4 py-2">Count</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {viewMode === 'list' ? (
                <>
                  <td className="border px-4 py-2">{item.dynamic_product?.name || 'Unknown'}</td>
                  <td className="border px-4 py-2 text-center">{item.quantity}</td>
                  <td className="border px-4 py-2">{formatCurrency(item.unit_price)}</td>
                  <td className="border px-4 py-2 font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="border px-4 py-2">{item.payment_method}</td>
                  <td className="border px-4 py-2 text-sm">{new Date(item.sold_at).toLocaleDateString()}</td>
                  <td className="border px-4 py-2 text-center">
                    <button onClick={() => onEdit(item)} className="text-blue-600 mr-2">
                      <FaEdit />
                    </button>
                    <button onClick={() => item.deviceIds?.length > 0 && openDetailModal(item)} className="text-green-600 mr-2">
                      <FaEye />
                    </button>
                    <button onClick={() => onDelete(item)} className="text-red-600">
                      <FaTrash />
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-4 py-2 font-medium">{item.period}</td>
                  <td className="border px-4 py-2 font-bold">{formatCurrency(item.total)}</td>
                  <td className="border px-4 py-2 text-center">{item.count}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}