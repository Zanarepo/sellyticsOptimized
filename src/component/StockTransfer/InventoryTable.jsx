// src/components/stockTransfer/InventoryTable.jsx
import { FaEye, FaEyeSlash, FaExchangeAlt } from "react-icons/fa";

export default function InventoryTable({ inventory, loading, show, toggleShow, onTransfer }) {
  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Inventory</h3>
        <button
          onClick={toggleShow}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          {show ? <FaEyeSlash /> : <FaEye />} {show ? "Hide" : "Show"}
        </button>
      </div>

      {show && (
        loading ? <p className="text-center text-gray-500">Loading...</p> :
        inventory.length === 0 ? <p className="text-center text-gray-500">No products</p> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-right">Available</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(row => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{row.dynamic_product?.name ?? `Product #${row.dynamic_product_id}`}</td>
                  <td className="p-3 text-right">{row.available_qty}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onTransfer(row)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                    >
                      <FaExchangeAlt /> Transfer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}