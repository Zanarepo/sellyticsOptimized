import React from "react";

export default function DateFilters({ startDate, endDate, setStartDate, setEndDate }) {
  return (
    <div className="w-full">
      <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 
                      dark:from-teal-900/40 dark:via-cyan-900/30 dark:to-blue-900/20 
                      rounded-2xl shadow-xl border border-teal-200 dark:border-teal-800">

        <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 mb-4">
          Custom Date Range
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 
                       dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 
                       focus:ring-teal-500 shadow-sm transition-all text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 
                       dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 
                       focus:ring-teal-500 shadow-sm transition-all text-sm"
          />
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Select custom start and end dates
        </p>
      </div>
    </div>
  );
}