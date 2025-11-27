// src/inventory/components/Cards/ProfitabilityCard.jsx
import React from "react";
import { usePreferredCurrency } from '../../../../Hooks/usePreferredCurrency'; // Fixed path (lowercase 'h')

export default function ProfitabilityCard({ data }) {
  const { formatCurrency } = usePreferredCurrency();

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow text-center text-gray-500">
        No profitability data available
      </div>
    );
  }

  const { totalRevenue = 0, totalCost = 0, totalProfit = 0, margin = 0 } = data;

  return (
    <div className="p-6 bg-indigo-50  dark:indigo-800 dark:to-gray-900 rounded-2xl shadow-lg border border-indigo-200 dark:border-gray-700">
      <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-6 text-center">
        Profitability Overview
      </h3>

      <div className="space-y-5 text-lg">
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Revenue</span>
          <span className="font-bold text-2xl text-green-600">
            {formatCurrency(totalRevenue)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Cost of Goods</span>
          <span className="font-bold text-2xl text-orange-600">
            {formatCurrency(totalCost)}
          </span>
        </div>

        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-indigo-600">
          <span className="font-medium text-gray-700 dark:text-gray-300">Gross Profit</span>
          <span className={`font-bold text-3xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalProfit)}
          </span>
        </div>

        <div className="flex justify-between items-center p-5 bg-indigo-600 text-white rounded-xl shadow-lg">
          <span className="text-xl font-semibold">Profit Margin</span>
          <span className={`text-4xl font-black ${margin >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {margin.toFixed(1)}%
          </span>
        </div>
      </div>

      {margin >= 50 && (
        <div className="mt-6 text-center text-green-600 font-bold text-lg animate-pulse">
          Excellent Margin!
        </div>
      )}
      {margin < 20 && margin >= 0 && (
        <div className="mt-6 text-center text-orange-600 font-bold">
          Consider raising prices or reducing costs
        </div>
      )}
      {margin < 0 && (
        <div className="mt-6 text-center text-red-600 font-bold">
          Currently operating at a loss
        </div>
      )}
    </div>
  );
}