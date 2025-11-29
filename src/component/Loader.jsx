// src/components/Loader.jsx
import React from "react";

/**
 * Reusable Full-Screen Loader
 * Uses your brand color: Indigo (#4F46E5 / indigo-600)
 * Clean, modern, centered spinner with subtle overlay
 */
export default function Loader({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Brand Spinner - Indigo */}
        <div className="animate-spin h-16 w-16 border-4 border-indigo-600 rounded-full border-t-transparent mx-auto"></div>
        
        {/* Optional Message */}
        <p className="mt-6 text-white text-lg font-medium tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}