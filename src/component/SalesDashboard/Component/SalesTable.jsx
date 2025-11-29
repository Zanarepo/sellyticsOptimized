// src/components/SalesDashboard/Component/SalesTable.jsx
import React, { useState, useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { FaEye, FaEyeSlash, FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import Pagination from "./Pagination";
import { useCurrency } from "../hooks/useCurrency";
import { computeKPIs } from "../utils/computeKPIs";
import ProductTrendsModal from "./ProductTrendsModal";

function Arrow({ direction }) {
  if (direction === "up") return <FaArrowUp className="inline-block text-green-600" />;
  if (direction === "down") return <FaArrowDown className="inline-block text-red-600" />;
  return <FaMinus className="inline-block text-gray-400" />;
}

// Aggregate sales by period
function aggregateSales(data, period = "daily") {
  const grouped = {};

  data.forEach(sale => {
    let periodKey;
    const date = new Date(sale.soldAt);

    if (period === "daily") periodKey = format(date, "yyyy-MM-dd");
    else if (period === "weekly") periodKey = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"); // ISO week start
    else if (period === "monthly") periodKey = format(date, "yyyy-MM");

    const key = `${sale.productId}-${periodKey}`;
    if (!grouped[key]) {
      grouped[key] = {
        productId: sale.productId,
        productName: sale.productName,
        productUrl: sale.productUrl,
        dateKey: periodKey,
        quantity: 0,
        totalSales: 0,
        unitPrice: sale.unitPrice, // take first
        soldAt: date, // for display
      };
    }

    grouped[key].quantity += sale.quantity;
    grouped[key].totalSales += sale.totalSales;
  });

  return Object.values(grouped).sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
}

export default function SalesTable({ data = [] }) {
  const { formatCurrency } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("daily"); // daily, weekly, monthly

  const aggregatedData = useMemo(() => aggregateSales(data, filterPeriod), [data, filterPeriod]);
  const { productMetrics = {} } = useMemo(() => computeKPIs(data), [data]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(aggregatedData.length / itemsPerPage);
  const currentData = aggregatedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setModalOpen(true);
  };

  const closeProductModal = () => {
    setModalOpen(false);
    setSelectedProductId(null);
  };

  const recentTransactions = selectedProductId
    ? data.filter(d => d.productId === selectedProductId)
    : [];
    const selectedMetric = selectedProductId ? productMetrics[selectedProductId] : null;


  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-12">
        No sales recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      {/* Header with Toggle & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/40 dark:via-purple-900/30 dark:to-pink-900/20 rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-800 mb-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400 ">
          Sales Transactions
        </h2>

        <div className="flex gap-4 items-center">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button
            onClick={() => setIsVisible(!isVisible)}
            className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg
              ${isVisible
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
              } active:scale-95`}
          >
            {isVisible ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
            <span className="text-sm sm:text-base">{isVisible ? 'Hide Table' : 'View Sales'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isVisible ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white dark:bg-gray-800 overflow-x-auto rounded-b-2xl border-t border-indigo-200 dark:border-indigo-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentData.map((sale, i) => {
                const pm = productMetrics[sale.productId];
                const amountPercent = pm?.amountMoMPercent ?? 0;
                const amountDir = pm?.amountMoMDirection ?? 'neutral';

                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {sale.dateKey}
                    </td>

                    <td
                      onClick={() => openProductModal(sale.productId)}
                      className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate cursor-pointer select-none"
                      title="Click to view product details"
                    >
                      <div className="flex items-center gap-3">
                        <a
                          href={sale.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-600 underline hover:text-blue-800"
                        >
                          {sale.productName}
                        </a>
                        <span className="ml-2 inline-flex items-center text-xs font-semibold">
                          <Arrow direction={amountDir} />
                          <span
                            className={`ml-1 ${
                              amountDir === "up" ? "text-green-600" :
                              amountDir === "down" ? "text-red-600" : "text-gray-400"
                            }`}
                          >
                            {pm ? `${Math.abs(Number(amountPercent)).toFixed(1)}%` : "—"}
                          </span>
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(sale.unitPrice)}
                    </td>

                    <td className="px-6 py-4 text-sm text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {sale.quantity}
                    </td>

                    <td className="px-6 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {formatCurrency(sale.totalSales)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-5 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageCount={totalPages}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Collapsed hint */}
      {!isVisible && (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap the eye icon above to reveal all {aggregatedData.length} sales transactions
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-8 py-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-indigo-200 dark:border-indigo-800">
        Real-time sales data • Includes all filtered results
      </div>

      {/* Product modal */}
      <ProductTrendsModal
        open={modalOpen}
        onClose={closeProductModal}
        productMetric={selectedMetric}
        recentTransactions={recentTransactions}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
