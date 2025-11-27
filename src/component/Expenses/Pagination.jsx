// components/Expense/Pagination.jsx
export default function Pagination({
    currentPage,
    setCurrentPage,
    totalItems,
    itemsPerPage = 10,
    isLoading = false,
  }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 px-4 gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        {/* Showing X to Y of Z */}
        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          Showing{' '}
          {totalItems === 0 ? '0' : `${startItem} to ${endItem}`} of {totalItems} expenses
        </div>
  
        {/* Pagination Controls */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              currentPage === 1 || isLoading
                ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            Previous
          </button>
  
          <div className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[120px] text-center">
            Page {currentPage} of {totalPages}
          </div>
  
          <button
            type="button"
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              currentPage === totalPages || isLoading
                ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  }