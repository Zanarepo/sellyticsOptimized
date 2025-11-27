// src/components/stockTransfer/TransferHistoryTable.jsx
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function TransferHistoryTable({
  entries,
  totalPages,
  currentPage,
  paginate,
  loading,
  show,
  toggleShow,
  onViewDetails
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transfer History</h3>
        <button
          onClick={toggleShow}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          {show ? <FaEyeSlash /> : <FaEye />} {show ? "Hide" : "Show"}
        </button>
      </div>

      {show && (
        loading ? <p className="text-center text-gray-500">Loading...</p> :
        entries.length === 0 ? <p className="text-center text-gray-500">No history</p> :
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Source</th>
                  <th className="p-3 text-left">Destination</th>
                  <th className="p-3 text-left">Product</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{t.source_store?.shop_name}</td>
                    <td className="p-3">{t.destination_store?.shop_name}</td>
                    <td className="p-3">
                      <button
                        onClick={() => onViewDetails(t)}
                        className="text-indigo-600 hover:underline"
                      >
                        {t.product?.name}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {entries.length ? (currentPage - 1) * 10 + 1 : 0} to{" "}
              {Math.min(currentPage * 10, entries.length + (currentPage - 1) * 10)} of {entries.length + (currentPage - 1) * 10}
            </div>
            <div className="flex gap-2">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-indigo-600 text-white disabled:bg-gray-300">
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-indigo-600 text-white disabled:bg-gray-300">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}