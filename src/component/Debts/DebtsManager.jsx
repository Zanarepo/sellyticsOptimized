// src/components/Debts/DebtsManager.jsx
import React from 'react';
import DebtTable from './DebtTable';
import EditDebtModal from './EditDebtModal';
import DebtDetailModal from './DebtDetailModal';
import ScannerModal from '../products/ScannerModal';
import ToastNotification from './ToastNotification';
import useDebt from './useDebt';
import DeviceDebtRepayment from '../UserDashboard/DeviceDebtRepayment';

export default function DebtsManager() {
  const {
    filteredDebts,
    searchTerm,
    setSearchTerm,
    editing,
    setEditing,
    showDetail,
    setShowDetail,
    showScanner,
    handleScanSuccess,
    closeScanner,
    openScanner,
    notifications,
    fetchDebts,
    // *** FIX: Destructure the required delete function from useDebt() ***
    deleteDebtFromDatabase, 
  } = useDebt();

  const storeId = localStorage.getItem("store_id");
  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl font-bold">Store ID missing — please log in</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <DeviceDebtRepayment />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
        <DebtTable
          debts={filteredDebts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAdd={() => setEditing({})}
          onEdit={setEditing}
          onViewDetail={setShowDetail}
          openScanner={openScanner}   
          onDelete={deleteDebtFromDatabase} // This reference is now defined
        />

        {editing !== null && (
          <EditDebtModal
            initialData={editing}
            onClose={() => setEditing(null)}
            onSuccess={() => { setEditing(null); fetchDebts(); }}
          />
        )}

        {showDetail && (
          <DebtDetailModal
            debt={showDetail}
            onClose={() => setShowDetail(null)}
          />
        )}

        {/* SCANNER MODAL — NOW 100% WORKING WITH DEBUG MESSAGES */}
        <ScannerModal
          isOpen={showScanner}
          onScan={handleScanSuccess}
          onClose={closeScanner}
        />

        <ToastNotification notifications={notifications} />
      </div>
    </div>
  );
}