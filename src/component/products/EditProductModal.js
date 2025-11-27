// EditProductModal.jsx — FINAL PROFESSIONAL VERSION (Same as DetailModal)
import React, { useEffect, useState } from 'react';
import { FaCamera, FaTrashAlt, FaTimes } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import ScannerModal from './ScannerModal';
import { toast } from 'react-toastify';
import { hasDuplicateDeviceId } from '../../utils/deviceValidation'

export default function EditProductModal({ product, storeId, onSave, onClose }) {
  const [form, setForm] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [, setScannerTarget] = useState(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const userEmail = localStorage.getItem('user_email');

  useEffect(() => {
    if (!userEmail || !storeId) {
      setLoadingAuth(false);
      return;
    }

    const checkOwnership = async () => {
      try {
        // Check if user is in stores table (owner)
        const { data: storeOwner } = await supabase
          .from('stores')
          .select('id')
          .eq('id', storeId)
          .eq('email_address', userEmail)
          .single();

        // Check if user is store_user

        setIsStoreOwner(!!storeOwner);
      } catch {
        setIsStoreOwner(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkOwnership();
  }, [userEmail, storeId]);

  useEffect(() => {
    if (!product) return;

    const isU = product.is_unique;

    const initialIds = isU && product.dynamic_product_imeis
      ? product.dynamic_product_imeis.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const initialSizes = isU && product.device_size
      ? product.device_size.split(',').map(s => s.trim())
      : Array(initialIds.length).fill('');

    setForm({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      suppliers_name: product.suppliers_name || '',
      purchase_price: product.purchase_price || '',
      selling_price: product.selling_price || '',
      is_unique: isU,
      purchase_qty: isU ? initialIds.length : "",
// purchase_qty: isU ? initialIds.length : (product.purchase_qty || 0),
      device_id: !isU ? (product.device_id || '') : '',
      device_size: !isU ? (product.device_size || '') : '',
      deviceIds: isU ? [''] : [],        // ← Only one blank for NEW IMEIs
      deviceSizes: isU ? [...initialSizes, ''] : [],      // ← Only one blank for sizes
     
    });
  }, [product]);

  if (!form || loadingAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10">
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleUnique = (checked) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        is_unique: true,
        deviceIds: prev.device_id ? [prev.device_id, ''] : [''],
        deviceSizes: prev.device_size ? [prev.device_size, ''] : ['', ''],
        device_id: '',
        device_size: '',
        purchase_qty: '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        is_unique: false,
        device_id: prev.deviceIds[0] || '',
        device_size: prev.deviceSizes[0] || '',
        deviceIds: [],
        deviceSizes: [],
      }));
    }
  };

  const openScanner = (idx) => {
    setScannerTarget({ isUnique: form.is_unique, idx });
    setScannerOpen(true);
  };

  const handleScan = (code) => {
    const trimmed = String(code).trim();
    if (!trimmed) return;

    if (form.is_unique) {
      if (hasDuplicateDeviceId([form], trimmed)) {
        toast.error("Duplicate ID detected!");
        return;
      }

      setForm(prev => {
        const newIds = prev.deviceIds.filter(Boolean);
        const newSizes = prev.deviceSizes.slice(0, newIds.length);
        newIds.push(trimmed);
        newSizes.push('');
        return { ...prev, deviceIds: [...newIds, ''], deviceSizes: [...newSizes, ''] };
      });
    } else {
      set('device_id', trimmed);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
  
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      suppliers_name: form.suppliers_name?.trim() || null,
      purchase_price: Number(form.purchase_price) || 0,
      selling_price: Number(form.selling_price) || 0,
    };
  
    let inventoryDelta = 0;
  
    if (form.is_unique) {
      // Get OLD IMEIs from DB (never from form)
      const oldIds = product.dynamic_product_imeis
        ? product.dynamic_product_imeis.split(',').map(s => s.trim()).filter(Boolean)
        : [];
  
      // Get ONLY NEW IMEIs (from form — last inputs, excluding the blank one)
      const newIds = form.deviceIds
        .map(id => id.trim())
        .filter(id => id !== '');
  
      // Prevent duplicate in new ones
      if (new Set(newIds.map(i => i.toLowerCase())).size < newIds.length) {
        return toast.error("Duplicate IMEI in new entries!");
      }
  
      // Prevent new IMEI already exists
      const oldSet = new Set(oldIds.map(i => i.toLowerCase()));
      for (const id of newIds) {
        if (oldSet.has(id.toLowerCase())) {
          return toast.error(`IMEI ${id} already exists!`);
        }
      }
  
      // Combine old + new
      const allIds = [...oldIds, ...newIds];
      const oldSizes = product.device_size
        ? product.device_size.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const newSizes = form.deviceSizes.slice(0, newIds.length).map(s => s.trim());
  
      payload.dynamic_product_imeis = allIds.length ? allIds.join(',') : null;
      payload.device_size = [...oldSizes, ...newSizes].join(',') || null;
      payload.purchase_qty = 0;
      payload.device_id = null;
  
      inventoryDelta = newIds.length;  // ← ONLY add the NEW count

    } else {
      const restock = Number(form.purchase_qty) || 0;
      if (restock < 0) return toast.error('Restock cannot be negative');
    
      // THIS IS THE ONLY LINE THAT MATTERS — MAKE SURE IT ADDS!
      payload.purchase_qty = restock;   // ← OVERRIDE: only show last restock amount
    
      payload.device_id = form.device_id?.trim() || null;
      payload.device_size = form.device_size?.trim() || null;
      payload.dynamic_product_imeis = null;
    
      inventoryDelta = restock;  // This tells useProducts.js to ADD this amount
    }
  
    try {
      await onSave(product.id, payload, inventoryDelta);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Product</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-6">
            <input
              type="text"
              placeholder="Product Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-5 py-4 border rounded-lg text-lg focus:ring-2 focus:ring-indigo-500"
              required
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-5 py-4 border rounded-lg"
              rows="3"
            />

            <input
              type="text"
              placeholder="Supplier"
              value={form.suppliers_name}
              onChange={e => set('suppliers_name', e.target.value)}
              className="w-full px-5 py-4 border rounded-lg"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Purchase Price"
                value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                className="px-5 py-4 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Selling Price"
                value={form.selling_price}
                onChange={e => set('selling_price', e.target.value)}
                className="px-5 py-4 border rounded-lg"
              />
            </div>

            <label className="flex items-center gap-3 text-base">
              <input
                type="checkbox"
                checked={form.is_unique}
                onChange={e => toggleUnique(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium">Unique Items (IMEI/Serial)</span>
            </label>

            {!form.is_unique && (
              <input
                type="number"
                placeholder="Restock Quantity"
                value={form.purchase_qty}
                onChange={e => set('purchase_qty', e.target.value)}
                className="w-full px-5 py-4 border-2 border-indigo-500 rounded-lg text-lg font-bold"
                //required
              />
            )}

          {/* UNIQUE ITEMS */}
{form.is_unique && (
  <div className="border-t pt-6">
    <h3 className="text-lg font-semibold mb-4">IMEI / Serial Numbers</h3>

    <div className="space-y-3">
      {form.deviceIds.map((id, i) => {
        const isExisting = i < form.deviceIds.length - 1 && id;
        const canEdit = isStoreOwner || !isExisting;

        return (
          <div key={i} className="flex gap-3 items-center">
            {/* IMEI Field */}
            <input
              type="text"
              value={id}
              readOnly={!canEdit}
              onChange={e => {
                            const value = e.target.value;
                            if (value && hasDuplicateDeviceId([form], value, null, i)) {
                              toast.error("Duplicate ID detected! ");
                              return;
                            }
                const newIds = [...form.deviceIds];
                            newIds[i] = value;
                setForm({ ...form, deviceIds: newIds });
              }}
              placeholder={canEdit ? "Scan or type IMEI" : "Protected (Owner only)"}
                          className={`flex-1 px-4 py-3 border rounded-lg ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />

            <input
              type="text"
              value={form.deviceSizes[i] || ''}
              onChange={e => {
                const newSizes = [...form.deviceSizes];
                newSizes[i] = e.target.value;
                setForm({ ...form, deviceSizes: newSizes });
              }}
              placeholder="Size"
              className="w-32 px-4 py-3 border rounded-lg"
            />

            {/* Scan Button only for last row */}
            {i === form.deviceIds.length - 1 && (
              <button
                type="button"
                            onClick={() => openScanner(i)}
                className="p-3 text-indigo-600 rounded-lg hover:bg-indigo-100"
              >
                <FaCamera />
              </button>
            )}

            {isExisting && isStoreOwner && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    deviceIds: form.deviceIds.filter((_, j) => j !== i),
                    deviceSizes: form.deviceSizes.filter((_, j) => j !== i),
                  });
                }}
                            className="p-3 text-red-600 rounded-lg hover:bg-red-100"
              >
                <FaTrashAlt />
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* Add Row Button (BOTTOM LEFT) */}
    <div className="mt-4">
      <button
        type="button"
                    onClick={() => setForm(prev => ({
            ...prev,
            deviceIds: [...prev.deviceIds, ''],
                      deviceSizes: [...prev.deviceSizes, ''],
                    }))}
        className="text-indigo-600 text-sm"
      >
        + Add another ID
      </button>
    </div>

    {!isStoreOwner && (
      <p className="text-xs text-orange-600 mt-3">
        Only store owner can edit or delete existing product IDs
      </p>
    )}
  </div>
)}

            {/* NON-UNIQUE */}
            {!form.is_unique && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Generic Barcode"
                  value={form.device_id}
                  onChange={e => set('device_id', e.target.value)}
                  className="flex-1 px-5 py-4 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Size/Color"
                  value={form.device_size}
                  onChange={e => set('device_size', e.target.value)}
                  className="w-40 px-5 py-4 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => openScanner(0)}
                  className="px-6 py-4 text-indigo-600 rounded-lg hover:bg-indigo-100"
                >
                  <FaCamera className="text-xl" />
                </button>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-300 rounded-lg font-medium">
                Cancel
              </button>
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-lg">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {scannerOpen && (
        <ScannerModal
          isOpen={scannerOpen}
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}

