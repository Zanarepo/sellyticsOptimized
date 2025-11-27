// src/components/Debts/DebtTable.jsx
import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import Pagination from './Pagination'; // Your beautiful pagination component
import { toastError, toastSuccess } from '../products/toastError';

const ITEMS_PER_PAGE = 20;

export default function DebtTable({ debts, onAdd, onEdit, onViewDetail, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, Paid, Partial, Unpaid
  const [returnFilter, setReturnFilter] = useState('all'); // all, yes, no
  const [currentPage, setCurrentPage] = useState(1);

  // --- Delete Handler ---
  const handleDelete = (debtId, customerName, productName) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the debt for ${customerName} (${productName})? This action cannot be undone.`
    );

    if (isConfirmed) {
      try {
        onDelete(debtId);
        toastSuccess(`Debt for ${customerName} deleted successfully.`);
      } catch (error) {
        console.error("Error during delete:", error);
        toastError("Failed to delete debt. Please try again.");
      }
    } else {
      toastError("Deletion cancelled.");
    }
  };

  // --- Filtering Logic ---
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const balance = (d.owed || 0) - (d.deposited || 0);
      const isPaid = balance <= 0;
      const isPartial = d.deposited > 0 && balance > 0;
      const autoStatus = isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid';
      const displayStatus = d.status || autoStatus;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        d.customer_name?.toLowerCase().includes(searchLower) ||
        d.product_name?.toLowerCase().includes(searchLower) ||
        d.customer_phone?.toLowerCase().includes(searchLower) ||
        d.dynamic_product_id?.toString().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;
      const matchesReturn = returnFilter === 'all' ||
        (returnFilter === 'yes' && d.is_returned) ||
        (returnFilter === 'no' && !d.is_returned);

      return matchesSearch && matchesStatus && matchesReturn;
    });
  }, [debts, searchTerm, statusFilter, returnFilter]);

  // --- Pagination Logic ---
  const totalItems = filteredDebts.length;
 
  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDebts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDebts, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, returnFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header: Search + Filters + Add Button */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

          {/* Search Bar */}
          <div className="relative flex-1 max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by customer, product, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters + Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            {/* Return Filter */}
            <select
              value={returnFilter}
              onChange={(e) => setReturnFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="all">All Returns</option>
              <option value="yes">Returned</option>
              <option value="no">Not Returned</option>
            </select>

            {/* Add Button */}
            <button
              onClick={onAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto new-sale-button"
            >
              <FaPlus size={18} />
              <span>Add Debt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Return</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedDebts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {totalItems === 0 ? 'No debts found matching your filters.' : 'No debts on this page.'}
                </td>
              </tr>
            ) : (
              paginatedDebts.map((d) => {
                const balance = (d.owed || 0) - (d.deposited || 0);
                const isPaid = balance <= 0;
                const isPartial = d.deposited > 0 && balance > 0;
                const autoStatus = isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid';
                const displayStatus = d.status || autoStatus;

                return (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{d.customer_name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewDetail(d)}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        {d.product_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(d.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        displayStatus === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        displayStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        d.is_returned ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {d.is_returned ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => onEdit(d)} className="text-blue-600 hover:scale-110 transition" title="Edit">
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.customer_name, d.product_name)}
                          className="text-red-600 hover:scale-110 transition"
                          title="Delete"
                        >
                          <FaTrashAlt size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 pt-8">
        <Pagination
          total={totalItems}
          pageSize={ITEMS_PER_PAGE}
          current={currentPage}
          onChange={setCurrentPage}
        />
      </div>
    </div>
  );
}