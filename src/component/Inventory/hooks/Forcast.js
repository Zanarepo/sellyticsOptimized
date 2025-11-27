import React from "react";
import { formatForecast } from "../../utils/forecastUtils";

export default function ForecastCard({ stockLife = 0, forecastDays = 0, restocks = [] }) {
  const totalRestocked = restocks.reduce((sum, r) => sum + r.quantity, 0);
  const recentRestocks = restocks.slice(-5).reverse(); // last 5

  return (
    <div className="p-6 bg-indigo-50 dark:bg-gray-900 rounded-2xl shadow-lg border border-indigo-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-6 text-center">
        Stock Forecast & Restock History
      </h3>

      <div className="space-y-5 text-lg">
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Avg Stock Life</span>
          <span className="font-bold text-2xl text-green-600">{stockLife} days</span>
        </div>

        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Days Until Stock-Out</span>
          <span className="font-bold text-2xl text-orange-600">{formatForecast(forecastDays)}</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-indigo-600">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Total Restocked</span>
            <span className="font-bold text-green-600">{totalRestocked}</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {recentRestocks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No restock history available</p>
            ) : (
              recentRestocks.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium">Qty: {r.quantity}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reason: {r.reason || "N/A"}
                    </p>
                    {r.updated_by_user_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Restocked by: {r.updated_by_user_name}
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
      </div>
    </div>
  );
}
