// src/components/InstructionsModal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            CSV Import Instructions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium">How to fill each column:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>name</strong> → Required. Product name (e.g. <code>iPhone 14</code>)
            </li>
            <li>
              <strong>description</strong> → Optional. Short description
            </li>
            <li>
              <strong>purchase_price</strong> → Required. Cost price (numbers only, no commas)
            </li>
            <li>
              <strong>selling_price</strong> → Required. Retail price
            </li>
            <li>
              <strong>suppliers_name</strong> → Optional. Supplier name
            </li>
            <li>
              <strong>device_ids</strong> → <strong>Semicolon-separated</strong> IMEI/serial numbers
              <br />
              <span className="text-xs text-gray-500">
                Example: <code>IMEI123;IMEI124;WATCH001</code>
              </span>
            </li>
            <li>
              <strong>device_sizes</strong> → Must match <code>device_ids</code> (same count)
              <br />
              <span className="text-xs text-gray-500">
                Example: <code>128GB;128GB;Black</code>
              </span>
            </li>
            <li>
              <strong>purchase_qty</strong> → Optional. Quantity bought (default 1)
            </li>
          </ol>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tips:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside mt-1 space-y-1">
              <li>Do <strong>NOT</strong> edit the header row</li>
              <li>Save file as <strong>.csv (UTF-8)</strong></li>
              <li>Blank <code>device_ids</code> = no devices</li>
              <li>Always match count of <code>device_ids</code> and <code>device_sizes</code></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}