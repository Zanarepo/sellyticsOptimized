// src/component/Sales/DetailModal.jsx
import React from 'react';
import { FaTimes, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatCurrency } from './formatCurrency';

export default function DetailModal({ show, devices, page, setPage, onClose, sale, currency }) {
  if (!show || !devices || devices.length === 0) return null;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(devices.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const paginated = devices.slice(start, start + itemsPerPage);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Sale Devices ({devices.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Optional: Sale Summary */}
        {sale && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Product:</span>
                <p className="truncate">{sale.dynamic_product?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium">Quantity:</span>
                <p>{sale.quantity}</p>
              </div>
              <div>
                <span className="font-medium">Amount:</span>
                <p className="font-bold">{formatCurrency(sale.amount, currency)}</p>
              </div>
              <div>
                <span className="font-medium">Date:</span>
                <p>{new Date(sale.sold_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Device List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-3">
            {paginated.map((device, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      #{start + idx + 1}
                    </span>
                    <code className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {device.id || '—'}
                    </code>
                    {device.size && (
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
                        {device.size}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(device.id)}
                  title="Copy ID"
                  className="ml-4 text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <FaCopy size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* No devices fallback */}
          {devices.length === 0 && (
            <p className="text-center text-gray-500 py-10">No device IDs recorded</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t dark:border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          Click any ID to copy • Total devices: {devices.length}
        </div>
      </div>
    </div>
  );
}