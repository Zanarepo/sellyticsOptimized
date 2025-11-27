// src/components/products/ScannerModal.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const playSuccessSound = () => {
  new Audio("https://freesound.org/data/previews/171/171671_2437358-lq.mp3")
    .play()
    .catch(() => {});
};

export default function ScannerModal({ isOpen, onScan, onClose }) {
  const scannerRef = useRef(null);
  const [useExternal, setUseExternal] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // CLEAN UP SCANNER PROPERLY
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (_) {}
    scannerRef.current = null;
  };

  // CAMERA SCANNER LOGIC
  useEffect(() => {
    if (!isOpen || useExternal) {
      stopScanner();
      return;
    }

    const initScanner = async () => {
      try {
        const scanner = new Html5Qrcode("scanner-container");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }, // FIX (min >= 50px)
          },
          (decodedText) => {
            const code = String(decodedText).trim();
            if (!code) return;

            playSuccessSound();
            onScan(code);
          }
        );
      } catch (err) {
        console.error("Camera scanner error:", err);
      }
    };

    initScanner();

    return () => stopScanner();
  }, [isOpen, useExternal, onScan]);

  // EXTERNAL SCANNER INPUT
  useEffect(() => {
    if (!isOpen || !useExternal) return;

    let buffer = "";
    let timeout;

    const handler = (e) => {
      if (e.key === "Enter") {
        const code = String(buffer).trim();
        if (code) {
          playSuccessSound();
          onScan(code);
        }
        buffer = "";
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => (buffer = ""), 150);
      }
    };

    document.addEventListener("keypress", handler);
    return () => document.removeEventListener("keypress", handler);
  }, [isOpen, useExternal, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
     <div className="absolute inset-0 pointer-events-none" />


      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="p-4 text-center text-lg font-bold border-b dark:border-gray-700">
          Scan Barcode / IMEI
        </div>

        <div className="p-5 space-y-5">

          {/* External scanner toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Use external scanner</span>
            <input
              type="checkbox"
              checked={useExternal}
              onChange={(e) => setUseExternal(e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          {/* CAMERA SCANNER */}
          {!useExternal && (
            <div className="bg-black rounded-xl overflow-hidden aspect-square max-h-80 mx-auto relative">
              <div id="scanner-container" className="w-full h-full" />
              <div className="absolute inset-0 border-4 border-red-500 pointer-events-none rounded-xl m-8" />
            </div>
          )}

          {/* External Scanner */}
          {useExternal && (
            <div className="py-12 text-center text-gray-600">
              <p className="font-semibold">Waiting for handheld scanner…</p>
              <p className="text-sm opacity-80 mt-1">Scan any code and it will auto-detect</p>
            </div>
          )}

          {/* MANUAL INPUT */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual entry</label>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter barcode / IMEI"
                className="flex-1 p-3 border rounded-lg dark:bg-gray-800"
              />
              <button
                onClick={() => {
                  const code = String(manualInput).trim();
                  if (code) {
                    playSuccessSound();
                    onScan(code);
                  }
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
              >
                OK
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-300 dark:bg-gray-700 rounded-lg"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
