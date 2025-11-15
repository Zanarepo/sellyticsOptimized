// src/components/QuickCustomerButton.jsx
import React, { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUserPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function QuickCustomerButton() {
  const storeId = Number(localStorage.getItem('store_id'));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullname: '',
    phone_number: '',
    email: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setForm({ fullname: '', phone_number: '', email: '', address: '' });
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!form.fullname.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);

    const payload = {
      store_id: storeId,
      fullname: form.fullname.trim(),
      phone_number: form.phone_number.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
    };

    const { error, data } = await supabase
      .from('customer')
      .insert(payload)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error('Create customer error:', error);
      toast.error('Failed to create customer');
    } else {
      toast.success(`${form.fullname} added!`);
      reset();

      // Notify parent to auto-select
      window.dispatchEvent(
        new CustomEvent('customerCreated', { detail: data })
      );
    }
  }, [storeId, form]);

  return (
    <>
      {/* ---------- BUTTON ---------- */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
      >
        <FaUserPlus className="text-sm" />
        New Customer
      </button>

      {/* ---------- MODAL ---------- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => e.target === e.currentTarget && reset()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
              Add New Customer
            </h3>

            <div className="space-y-4">
              {/* Full Name - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="fullname"
                  placeholder="John Doe"
                  value={form.fullname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Phone Number - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  name="phone_number"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phone_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Email - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Address - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  name="address"
                  placeholder="123 Main St, Lagos"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={reset}
                disabled={saving}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}