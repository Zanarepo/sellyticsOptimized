import React from "react";

export default function PresetButtons({ applyPreset }) {
  const presets = [
    { label: "Today", key: "today" },
    { label: "Last 7 Days", key: "7days" },
    { label: "This Week", key: "week" },
    { label: "This Month", key: "month" },
  ];

  return (
    <div className="w-full">
      <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 
                      dark:from-indigo-900/40 dark:via-purple-900/30 dark:to-pink-900/20 
                      rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-800">

        <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-4">
          Quick Date Filters
        </h3>

        {/* Responsive wrap on mobile */}
        <div className="flex flex-wrap gap-2.5">
          {presets.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-md border 
                         border-indigo-200 dark:border-indigo-700 font-medium text-indigo-700 
                         dark:text-indigo-300 hover:bg-indigo-600 hover:text-white 
                         hover:shadow-lg transition-all duration-300 active:scale-95 whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Tap to filter instantly
        </p>
      </div>
    </div>
  );
}