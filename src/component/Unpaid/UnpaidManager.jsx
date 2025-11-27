// components/Unpaid/UnpaidManager.jsx

import React, { useEffect, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useDebtPayments from './useDebtPayments';
import RepayModal from './RepayModal';           // ← For recording payment
import RepayDetailModal from './RepayDetailModal'; // ← For viewing details
import RepayHistory from './RepayHistory';
import DeviceIdsModal from './DeviceIdsModal';
import RepayTable from './RepayTable';
import SummaryCards from './SummaryCards';
import Pagination from './Pagination';

export default function UnpaidManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const [showManager, setShowManager] = useState(false);

  // Modal states
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);     // ← NEW
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const {
    filteredDebts,
    search,
    setSearch,
    page,
    setPage,
    totalCount,
    pageSize,
    statusFilter,
    setStatusFilter,
    metrics,
    fetchDebts,
    checkSoldDevices,
    detailPageSize,
  } = useDebtPayments(storeId);

  // Auto-fetch when manager opens
  useEffect(() => {
    if (showManager && storeId) {
      fetchDebts();
    }
  }, [showManager, page, storeId, fetchDebts]);

  // Handlers
  const openPayModal = (debt) => {
    setSelectedDebt(debt);
    setShowPayModal(true);
  };

  const openDetailModal = (debt) => {           // ← NEW HANDLER
    setSelectedDebt(debt);
    setShowDetailModal(true);
  };

  const openHistory = (debt) => {
    setSelectedDebt(debt);
    setShowHistoryModal(true);
  };

  const openDevices = async (debt) => {
    setSelectedDebt(debt);
    if (debt.deviceIds?.length > 0) {
      await checkSoldDevices(debt.deviceIds);
    }
    setShowDeviceModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    setSelectedDebt(null);
    fetchDebts();
    toast.success('Payment recorded successfully!');
  };

  // Initial toggle screen
  if (!showManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <ToastContainer />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 mb-8">
            Debt Repayment Manager
          </h1>
          <button
            onClick={() => setShowManager(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto new-sale-button"
          >
            <FaPlus className="text-xl" />
            Open Repayment Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">
            Debt Repayment Manager
          </h1>
          <button
            onClick={() => setShowManager(false)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            <FaTimes /> Close
          </button>
        </div>

        <SummaryCards metrics={metrics} />

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search customer, product, Product ID, or bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-300 dark:bg-gray-800 dark:text-white shadow-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
          >
            <option value="All">All Debts</option>
            <option value="Unpaid">Unpaid Only</option>
            <option value="Paid">Paid Only</option>
          </select>
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <RepayTable
            debts={filteredDebts}
            onPay={openPayModal}
            onViewDetail={openDetailModal}    // ← Pass this to RepayTable
            onHistory={openHistory}
            onViewDevices={openDevices}
          />
        </div>

        <Pagination page={page} setPage={setPage} totalCount={totalCount} pageSize={pageSize} />
      </div>

      {/* ========== ALL MODALS ========== */}
      {showPayModal && selectedDebt && (
        <RepayModal
          debt={selectedDebt}
          onClose={() => {
            setShowPayModal(false);
            setSelectedDebt(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showDetailModal && selectedDebt && (
        <RepayDetailModal
          debt={selectedDebt}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDebt(null);
          }}
        />
      )}

      {showHistoryModal && selectedDebt && (
        <RepayHistory
          debt={selectedDebt}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showDeviceModal && selectedDebt && (
        <DeviceIdsModal
          debt={selectedDebt}
          onClose={() => setShowDeviceModal(false)}
          pageSize={detailPageSize}
        />
      )}
    </div>
  );
}