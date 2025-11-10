// src/components/InfoIcon.jsx
import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

export default function InfoIcon({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
      title="View CSV Instructions"
    >
      <FaInfoCircle className="w-4 h-4" />
    </button>
  );
}