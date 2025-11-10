import React from 'react';
import { FaCamera } from 'react-icons/fa';

export default function ScannerModal({
  show,
  externalScannerMode,
  setExternalScannerMode,
  scannerLoading,
  scannerError,
  scannerDivRef,
  videoRef,
  manualInput,
  setManualInput,
  handleManualInput,
  onDone,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-5 relative dark:bg-gray-900 dark:text-white">

        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-200">
          Scan Product ID
        </h2>

        {/* Checkbox ALWAYS visible */}
        <div className="relative z-20 bg-white dark:bg-gray-900 p-2 rounded">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={externalScannerMode}
              onChange={() => setExternalScannerMode((prev) => !prev)}
              className="h-4 w-4 text-indigo-600 rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <span>Use External Barcode Scanner</span>
          </label>
        </div>

        {/* CAMERA AREA */}
        {!externalScannerMode && (
          <div className="relative z-10 space-y-3">

            {scannerLoading && (
              <div className="text-gray-600 dark:text-gray-400">
                Initializing webcam scanner...
              </div>
            )}

            {scannerError && (
              <div className="text-red-600 dark:text-red-400">{scannerError}</div>
            )}

            <div
              id="scanner"
              ref={scannerDivRef}
              className="relative w-full h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover relative z-0"
                autoPlay
                playsInline
              />
              <div className="absolute bottom-3 flex justify-center w-full pointer-events-none">
                <FaCamera className="text-red-500 opacity-70 text-3xl" />
              </div>
            </div>
          </div>
        )}

        {/* External Scanner Message */}
        {externalScannerMode && (
          <div className="text-gray-600 dark:text-gray-400">
            Waiting for external scanner input...
          </div>
        )}

        {/* Manual INPUT */}
        <div className="space-y-1 relative z-20">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Or Enter Product ID Manually
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter Product ID"
              className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleManualInput}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full sm:w-auto"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Done Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
