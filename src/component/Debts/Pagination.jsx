// src/components/Debts/Pagination.jsx
import React from 'react';

export default function Pagination({ total, pageSize, current, onChange }) {
  const totalPages = Math.ceil(total / pageSize);

  // If only one page or no items, hide pagination
  if (totalPages <= 1 || total === 0) return null;

  // Calculate range of items shown
  const indexOfFirstEntry = (current - 1) * pageSize;
  const indexOfLastEntry = Math.min(indexOfFirstEntry + pageSize, total);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== current) {
      onChange(pageNumber);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center mt-6 px-4 gap-4">
      {/* Showing X to Y of Z */}
      <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
        Showing {indexOfFirstEntry + 1} to {indexOfLastEntry} of {total} entries
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => paginate(current - 1)}
          disabled={current === 1}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            current === 1
              ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md hover:shadow-lg'
          }`}
          aria-label="Previous page"
        >
          Previous
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => paginate(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              current === page
                ? 'bg-indigo-600 text-white dark:bg-indigo-700 shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={current === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => paginate(current + 1)}
          disabled={current === totalPages}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            current === totalPages
              ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md hover:shadow-lg'
          }`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}