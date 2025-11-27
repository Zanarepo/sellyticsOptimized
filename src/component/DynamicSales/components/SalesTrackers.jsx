// src/components/DynamicSales/SalesTracker.jsx
import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import useSalesWithUserFilter from './hooks/useSalesWithUserFilter';
import SalesSummary from './components/SalesSummary';
import ExportFile from './components/ExportFile';
import OnboardingTour from './components/OnboardingTour';
import SalesTable from './components/SalesTable';
import SalesForm from './components/SalesForm';
import ScannerModal from './components/ScannerModal';
import CreateCustomer from './CreateCustomer';

const itemsPerPage = 20;

const formatCurrency = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('salesTrackerOnboardingCompleted'));
  const [onboardingStep, setOnboardingStep] = useState(0);

  const {
    sales,
    filtered,
    setFiltered,
    loading,
    isOwner,
    refetch: refetchSales,
  } = useSalesWithUserFilter(storeId);

  // Search filtering
  useEffect(() => {
    if (!search) return setFiltered(sales);
    const q = search.toLowerCase();
    setFiltered(sales.filter(s =>
      s.dynamic_product.name.toLowerCase().includes(q) ||
      s.payment_method.toLowerCase().includes(q) ||
      s.deviceIds.some(id => id.toLowerCase().includes(q)) ||
      (s.customer_name || '').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, sales, setFiltered]);

  const paginated = viewMode === 'list'
    ? filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const handleNextOnboarding = () => {
    if (onboardingStep < 2) setOnboardingStep(s => s + 1);
    else {
      setShowOnboarding(false);
      localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <ToastContainer />

      {!isOwner && (
        <div className="mb-4 p-4 bg-amber-100 dark:bg-amber-900 rounded-lg text-sm">
          You are viewing <strong>only your own sales</strong>. Store owner sees all.
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={viewMode}
            onChange={(e) => { setViewMode(e.target.value); setCurrentPage(1); }}
            className="p-2 border rounded view-mode-selector"
          >
            <option value="list">Individual Sales</option>
            <option value="daily">Daily Totals</option>
            <option value="weekly">Weekly Totals</option>
          </select>

          {viewMode === 'list' && (
            <input
              type="text"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded search-input w-64"
            />
          )}
          <CreateCustomer />
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 new-sale-button"
        >
          <FaPlus /> New Sale
        </button>
      </div>

      {viewMode !== 'list' ? (
        <SalesSummary
          viewMode={viewMode}
          totalsData={filtered}
          paginatedTotals={filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
        />
      ) : (
        <SalesTable
          paginatedSales={paginated}
          openDetailModal={() => {}}
          formatCurrency={formatCurrency}
          onEdit={() => {}}
          onDelete={() => {}}
          refetchSales={refetchSales}
        />
      )}

      <ExportFile viewMode={viewMode} filtered={filtered} totalsData={filtered} formatCurrency={formatCurrency} />

      <OnboardingTour
        show={showOnboarding}
        step={onboardingStep}
        onNext={handleNextOnboarding}
        onSkip={handleSkipOnboarding}
      />

      {/* Modals remain the same — just pass refetchSales down */}
      {showAdd && <SalesForm type="add" onClose={() => setShowAdd(false)} onSuccess={refetchSales} />}
    </div>
  );
}