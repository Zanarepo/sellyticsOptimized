// src/components/Pagination.jsx
import React from "react";

export default function Pagination({
  currentPage,
  pageCount,
  setCurrentPage,
  totalItems,
  itemsPerPage,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNext = () => setCurrentPage((p) => Math.min(p + 1, pageCount));

  return (
    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 py-4 px-2 sm:px-0">
      {/* Optional: Items Info (you can remove this block if not needed) */}
      {totalItems > 0 && (
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Showing <span className="font-medium">{startItem}</span>–
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span>
        </div>
      )}

      {/* Compact Pagination Controls - aligned to the right */}
      <nav className="flex items-center justify-end gap-2 sm:gap-3 pr-2 w-full sm:w-auto">
        {/* Previous Button */}
        <button
          onClick={goToPrev}
          disabled={currentPage === 1}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${currentPage === 1
              ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm hover:shadow"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        {/* Current Page Display */}
        <div className="flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 bg-indigo-600 text-white dark:bg-indigo-700 rounded-md font-semibold text-sm shadow">
          {currentPage}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={currentPage === pageCount}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${currentPage === pageCount
              ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm hover:shadow"
            }`}
        >
          Next
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
}