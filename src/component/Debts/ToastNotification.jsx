// src/components/Debts/ToastNotification.jsx
import React from 'react';

export default function ToastNotification({ notifications = [] }) {
  return (
    <div className="fixed top-4 right-4 space-y-3 z-[9999]">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`px-6 py-4 rounded-xl text-white shadow-2xl animate-pulse ${
            n.type === 'success' ? 'bg-green-600' :
            n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {n.msg}
        </div>
      ))}
    </div>
  );
}