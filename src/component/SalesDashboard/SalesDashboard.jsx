import React, { useState } from "react";
import SalesTable from "../SalesDashboard/Component/SalesTable";
import SalesChartModal from "../SalesDashboard/Component/SalesChartModal";
import DateFilters from "../SalesDashboard/Component/DateFilters";
import PresetButtons from "../SalesDashboard/Component/PresetButtons";
import Pagination from "../SalesDashboard/Component/Pagination";
import SalesSummaryCard from "../SalesDashboard/Component/SalesSummaryCard";
import InventoryMovementCard from "../SalesDashboard/Component/InventoryMovementCard";


import useSalesData from "../SalesDashboard/hooks/useSalesData";
import useSalesFilters from "../SalesDashboard/hooks/useSalesFilters";
import usePagination from "../SalesDashboard/hooks/usePagination";
import { useCurrency } from "../SalesDashboard/hooks/useCurrency";
import useAggregatedMetrics from "../SalesDashboard/hooks/useAggregatedMetrics";

import useRestockMetrics from "../SalesDashboard/hooks/useRestockMetrics";
import { exportCSV, exportPDF } from "./utils";

export default function SalesDashboard() {
  const { preferredCurrency } = useCurrency();

  // 1️⃣ Load sales data
  const { sales, loading: salesLoading } = useSalesData();

  // 2️⃣ Filter sales by date/search
  const {
    filteredData: filteredSales, // rename filteredData -> filteredSales
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    applyPreset,
  } = useSalesFilters(sales);
  
  // 3️⃣ Pagination
  const { pageData, currentPage, setCurrentPage, pageCount } = usePagination(filteredSales, 50);

  // 4️⃣ Metrics
  const salesMetrics = useAggregatedMetrics(filteredSales);
 
  const { restockMetrics } = useRestockMetrics();

  // 5️⃣ Chart modal
  const [showChart, setShowChart] = useState(false);

  // 6️⃣ Export functions
  const handleDownloadCSV = () => exportCSV(filteredSales, preferredCurrency);
  const handleDownloadPDF = () => exportPDF(filteredSales, preferredCurrency);

  if (salesLoading) {
    return <div className="text-center py-20 text-lg">Loading sales data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 dark:bg-gray-900 dark:text-white">
     
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <PresetButtons applyPreset={applyPreset} />
        <DateFilters
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
      {/* --- KPI Cards --- */}
    {/* Section 1: Sales Summary */}
<div className="mb-12">
  
  <div className="flex justify-center">
    <SalesSummaryCard metrics={salesMetrics} />
  </div>
</div>



<div className="mt-2">
    <SalesTable data={pageData} preferredCurrency={preferredCurrency} />
  </div>


{/* Section 2: Inventory Movement */}
<div className="mb-12">
 
  <div className="flex justify-center">
    <InventoryMovementCard restockMetrics={restockMetrics} />
  </div>
</div>
   

      {/* --- Filters --- */}
     
      <div className="w-full max-w-7xl mx-auto mb-12">
  {/* Unified Premium Card */}
  <div className="p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 
                  dark:from-indigo-900/40 dark:via-purple-900/30 dark:to-pink-900/20 
                  rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-800">

    <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400 text-center mb-10">
      File Exports & Charts
    </h2>

    {/* Responsive Grid: 1 → 3 columns */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

      {/* Export CSV */}
      <button
        onClick={handleDownloadCSV}
        className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center 
                   border-t-4 border-t-green-500 hover:shadow-xl transition-all duration-300 
                   hover:scale-105 active:scale-95"
      >
        <div className="w-14 h-14 mx-auto mb-4 bg-green-100 dark:bg-green-900/50 rounded-2xl 
                        flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 
                        transition-colors">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 10v6m-4-3h8m5 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-800 dark:text-white">Export CSV</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download all data</p>
      </button>

      {/* Export PDF */}
      <button
        onClick={handleDownloadPDF}
        className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center 
                   border-t-4 border-t-red-500 hover:shadow-xl transition-all duration-300 
                   hover:scale-105 active:scale-95"
      >
        <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-900/50 rounded-2xl 
                        flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800 
                        transition-colors">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-800 dark:text-white">Export PDF</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Printable report</p>
      </button>

      {/* Show Chart */}
      <button
        onClick={() => setShowChart(true)}
        className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center 
                   border-t-4 border-t-indigo-500 hover:shadow-xl transition-all duration-300 
                   hover:scale-105 active:scale-95"
      >
        <div className="w-14 h-14 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl 
                        flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 
                        transition-colors">
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-gray-800 dark:text-white">Show Chart</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visual analytics</p>
      </button>

    </div>

    <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
      All exports include filtered data • Updated in real-time
    </div>
  </div>
</div>




<div className="mb-8">

 
      {/* --- Pagination --- */}
      {pageCount > 1 && (
        
        <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} pageCount={pageCount} />
      )}

      {/* --- Chart Modal --- */}
      {showChart && (
        <SalesChartModal
          data={filteredSales}
          preferredCurrency={preferredCurrency}
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
    </div>
  );
}
