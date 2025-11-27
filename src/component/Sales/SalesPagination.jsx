// sales/SalesPagination.jsx
const itemsPerPage = 20;

export default function SalesPagination({ currentPage, setCurrentPage, totalItems }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex justify-between items-center mt-6 text-sm">
      <span className="text-gray-600 dark:text-gray-400">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </span>
      <div className="flex gap-2">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">
          Previous
        </button>
        <span className="px-4 py-2">{currentPage} / {totalPages || 1}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}