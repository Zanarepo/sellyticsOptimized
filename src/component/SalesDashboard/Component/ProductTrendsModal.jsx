// src/components/SalesDashboard/Component/ProductTrendsModal.jsx
import React from "react";
import { format } from "date-fns";
import { FaArrowUp, FaArrowDown, FaMinus, FaTimes } from "react-icons/fa";

function Arrow({ direction }) {
  if (direction === "up") return <FaArrowUp className="inline-block text-green-600" />;
  if (direction === "down") return <FaArrowDown className="inline-block text-red-600" />;
  return <FaMinus className="inline-block text-gray-400" />;
}

export default function ProductTrendsModal({
  open,
  onClose,
  productMetric,
  recentTransactions,
  formatCurrency,
}) {
  if (!open || !productMetric) return null;

  const {
    productName,
    currentAmount,
    prevAmount,
    amountMoMPercent,
    amountMoMDirection,
    currentQty,
    prevQty,
    qtyMoMPercent,
    qtyMoMDirection,
    months
  } = productMetric;

  // Optional: get month keys in ascending order
  const monthKeys = Object.keys(months).sort();
  const currentMonthKey = monthKeys[monthKeys.length - 1] || null;
  const prevMonthKey = monthKeys[monthKeys.length - 2] || null;

  const currentMonthTotals = currentMonthKey ? months[currentMonthKey] : { amount: 0, qty: 0 };
  const prevMonthTotals = prevMonthKey ? months[prevMonthKey] : { amount: 0, qty: 0 };

  // Limit recent activities to last 5
  const recentSummary = recentTransactions.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
    
    <div className="relative z-60 max-w-3xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-auto">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{productName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly performance & recent transactions
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FaTimes/>
        </button>
      </div>

        {/* Metric Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Revenue */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Revenue (Current Month)
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-2xl font-black text-green-700 dark:text-green-300">
                {formatCurrency(currentMonthTotals.amount)}
              </div>
              <div className="text-sm flex items-center gap-1">
                <Arrow direction={amountMoMDirection} />
                <span className={`font-semibold ${
                  amountMoMDirection === "up" ? "text-green-600" :
                  amountMoMDirection === "down" ? "text-red-600" : "text-gray-500"
                }`}>
                  {amountMoMPercent}% MoM
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Prev month: {formatCurrency(prevMonthTotals.amount)}
            </div>
          </div>

          {/* Units */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Units (Current Month)
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                {currentMonthTotals.qty}
              </div>
              <div className="text-sm flex items-center gap-1">
                <Arrow direction={qtyMoMDirection} />
                <span className={`font-semibold ${
                  qtyMoMDirection === "up" ? "text-green-600" :
                  qtyMoMDirection === "down" ? "text-red-600" : "text-gray-500"
                }`}>
                  {qtyMoMPercent}% MoM
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Prev month: {prevMonthTotals.qty}
            </div>
          </div>

          {/* Recent summary (last 5) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Recent Activity
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2 max-h-40 overflow-auto">
              {recentSummary.length > 0 ? recentSummary.map(tx => (
                <div key={tx.id} className="flex justify-between">
                  <div className="truncate pr-2">{format(new Date(tx.soldAt), "MMM dd")}</div>
                  <div className="font-semibold">{formatCurrency(tx.totalSales)}</div>
                </div>
              )) : (
                <div className="text-gray-400">No recent transactions</div>
              )}
            </div>
          </div>

        </div>

        {/* Full transaction list */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
    Recent transactions
  </h4>
  <div className="space-y-2 max-h-56 overflow-auto">
    {recentTransactions.length > 0 ? recentTransactions.slice(0, 10).map(tx => (
      <div key={tx.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
        <div className="text-sm text-gray-700 dark:text-gray-200">{format(new Date(tx.soldAt), "PPP p")}</div>
        <div className="text-sm text-indigo-600 dark:text-indigo-300 font-semibold">{formatCurrency(tx.totalSales)}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{tx.quantity} units</div>
      </div>
    )) : (
      <div className="text-gray-400">No transactions yet</div>
    )}
  </div>
</div>


      </div>
    </div>
  );
}
