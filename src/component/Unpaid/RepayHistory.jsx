// components/Unpaid/RepayHistory.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function RepayHistory({ debt, onClose }) {
  const [history, setHistory] = useState([]);
  const storeId = Number(localStorage.getItem('store_id'));

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('debt_payments')
        .select('payment_amount, paid_to, payment_date')
        .eq('store_id', storeId)
        .eq('customer_id', debt.customer_id)
        .eq('dynamic_product_id', debt.dynamic_product_id)
        .order('payment_date', { ascending: false });

      setHistory(data || []);
    };
    fetchHistory();
  }, [debt, storeId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Payment History</h2>
        <p className="text-sm mb-4">
          {debt.customer_name} → {debt.product_name} (ID: #{debt.dynamic_product_id})
        </p>

        {history.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Paid To</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p, i) => (
                <tr key={i} className="border-b dark:border-gray-700">
                  <td className="py-2">₦{Number(p.payment_amount).toFixed(2)}</td>
                  <td className="py-2">{p.paid_to || '—'}</td>
                  <td className="py-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}