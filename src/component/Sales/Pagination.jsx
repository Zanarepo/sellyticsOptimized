import React from 'react';

export default function Pagination({ currentPage, setCurrentPage, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300"
      >
        Previous
      </button>

      {[...Array(Math.min(totalPages, 10))].map((_, i) => {
        const pageNum = i + 1;
        return (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-4 py-2 rounded ${
              currentPage === pageNum
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      {totalPages > 10 && (
        <span className="px-4 py-2 text-gray-600">... {totalPages}</span>
      )}

      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300"
      >
        Next
      </button>
    </div>
  );
}