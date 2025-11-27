import React from "react";

export default function ForecastCard({
  stockLife = 0,
  forecastDays = 0,
  restocks = [],
 // totalRestocked = 0,
  //lastRestockQty = 0
}) {

  // Only show the 5 most recent restocks
  const recentRestocks = [...restocks].slice(0, 5);

  // Recommendation based on forecastDays
  let recommendation = "Stock level is sufficient";
  if (forecastDays <= 3) {
    recommendation = "⚠️ Reorder soon — stock is running low";
  } else if (forecastDays <= 7) {
    recommendation = "Consider restocking in the next few days";
  }

  return (
    <div className="p-6 bg-indigo-50 dark:bg-gray-900 rounded-2xl shadow-lg border border-indigo-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-6 text-center">
        Stock Forecast & Restock History
      </h3>

      <div className="space-y-5 text-lg">

        {/* Avg stock life */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Avg Stock Life</span>
          <span className="font-bold text-2xl text-green-600">{stockLife} days</span>
        </div>

        {/* Days until stock-out */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Days Until Stock-Out</span>
          <span className="font-bold text-2xl text-orange-600">{forecastDays}</span>
        </div>

        {/* Last restock qty 
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Last Restock Qty</span>
          <span className="font-bold text-2xl text-indigo-600">{lastRestockQty}</span>
        </div>
*/}
        {/* Total restocked 
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Total Restocked</span>
          <span className="font-bold text-2xl text-indigo-600">{totalRestocked}</span>
        </div>
*/}
        {/* Recent restocks */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-indigo-600">
          <span className="font-medium text-gray-700 dark:text-gray-300">Recent Restocks</span>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
            {recentRestocks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No restock history available</p>
            ) : (
              recentRestocks.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium">Qty: {r.difference}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reason: {r.reason || "N/A"}
                    </p>

                    {r.updated_by?.full_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Restocked by: {r.updated_by.full_name}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-4 p-4 bg-indigo-100 dark:bg-indigo-800 rounded-xl shadow-md text-center font-semibold text-indigo-700 dark:text-indigo-300">
          Recommendation: {recommendation}
        </div>

      </div>
    </div>
  );
}
