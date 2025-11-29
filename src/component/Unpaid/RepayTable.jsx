import React, { useState } from 'react';
import { FaHistory } from 'react-icons/fa';
import RepayDetailModal from './RepayDetailModal';
import Loader from '../Loader'; // Your brand loader

export default function RepayTable({ debts, onPay, onHistory, onViewDevices }) {
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false); // Track loading state

  const openDetailModal = async (debt) => {
    setIsLoadingDetail(true);
    setSelectedDebt(debt);
    setShowDetailModal(true);

    // Simulate loading (remove if real async work)
    setTimeout(() => {
      setIsLoadingDetail(false);
    }, 800);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Last Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  History
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {debts.map((d) => {
                const balance = d.remaining_balance || 0;
                const isPaid = balance <= 0;
                const isPartial = d.deposited > 0 && balance > 0;

                return (
                  <tr
                    key={`${d.customer_id}-${d.dynamic_product_id}`}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                      isPaid
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : isPartial
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {d.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetailModal(d)}
                        className="text-indigo-600 font-semibold hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-2 group"
                      >
                        {d.product_name}
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition">
                          (View Details)
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {d.last_payment_date
                        ? new Date(d.last_payment_date).toLocaleDateString('en-NG')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
                          isPaid
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : isPartial
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onHistory(d)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition"
                        title="View Payment History"
                      >
                        <FaHistory size={19} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {d.status !== 'paid' && (
                          <button
                            onClick={() => onPay(d)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-md transition transform hover:scale-105"
                          >
                            Pay Now
                          </button>
                        )}
                       
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {debts.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <p className="text-xl font-medium">No outstanding debts found</p>
              <p className="text-sm mt-2">All debts are fully paid or no records match your filter.</p>
            </div>
          )}
        </div>
      </div>
{isLoadingDetail && <Loader message="Loading payment details..." />} 
      {/* Detail Modal - Triggered by clicking Product name */}
      {showDetailModal && selectedDebt && (
        <RepayDetailModal
          debt={selectedDebt}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
}