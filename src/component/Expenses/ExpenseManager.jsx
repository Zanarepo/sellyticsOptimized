// src/components/Expenses/ExpenseManager.jsx
import React, { useState, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';

import { useExpense } from './useExpense';
import AddExpenseModal from './AddExpenseModal';
import ExpDetailedModal from './ExpDetailedModal';
import ExpenseSummaryCard from './ExpenseSummaryCard'; // New stunning design
import ExpenseTable from './ExpenseTable';
import Pagination from './Pagination';

export default function ExpenseManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpense(storeId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // ———— CORRECT METRICS USING YOUR ACTUAL COLUMN: expense_date ————
  const { totalExpenses, monthlyExpenses, todayExpenses } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];           // YYYY-MM-DD
    const thisMonth = new Date().toISOString().slice(0, 7);         // YYYY-MM

    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthly = expenses
      .filter(e => e.expense_date?.startsWith(thisMonth))  // ← CORRECT FIELD
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const todayTotal = expenses
      .filter(e => e.expense_date === today)               // ← CORRECT FIELD
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      totalExpenses: total,
      monthlyExpenses: monthly,
      todayExpenses: todayTotal,
    };
  }, [expenses]);

  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSave = async (data) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    setShowAddModal(false);
    setEditingExpense(null);
  };

  if (!storeId) {
    return (
      <div className="text-center py-20 text-red-600 text-2xl font-bold">
        No store selected
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">
            Expense Manager
          </h1>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto new-sale-button"
          >
            <FaPlus /> Add Expense
          </button>
        </div>

        {/* ———— GORGEOUS SUMMARY CARDS (Same as Unpaid Manager) ———— */}
        <ExpenseSummaryCard
          totalExpenses={totalExpenses}
          monthlyExpenses={monthlyExpenses}
          todayExpenses={todayExpenses}
        />

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-xl">Loading expenses...</div>
        ) : (
          <>
            <ExpenseTable
              expenses={paginatedExpenses}
              onView={setSelectedExpense}
              onEdit={(exp) => {
                setEditingExpense(exp);
                setShowAddModal(true);
              }}
              onDelete={deleteExpense}
            />

            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={expenses.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}

        {/* Modals */}
        {(showAddModal || editingExpense) && (
          <AddExpenseModal
            expense={editingExpense}
            onClose={() => {
              setShowAddModal(false);
              setEditingExpense(null);
            }}
            onSuccess={handleSave}
          />
        )}

        {selectedExpense && (
          <ExpDetailedModal
            expense={selectedExpense}
            onClose={() => setSelectedExpense(null)}
          />
        )}
      </div>
    </div>
  );
}