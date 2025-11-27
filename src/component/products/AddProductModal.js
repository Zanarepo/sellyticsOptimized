import { useState } from 'react';
import { FaTrashAlt, FaCamera } from 'react-icons/fa';
import ScannerModal from './ScannerModal';
import { toastError } from './toastError';
import { hasDuplicateDeviceId } from '../../utils/deviceValidation'

const initialForm = {
  name: '',
  description: '',
  purchase_price: '',
  purchase_qty: '',
  selling_price: '',
  suppliers_name: '',
  is_unique: false,
  deviceId: '',
  deviceSize: '',
  deviceIds: [''],
  deviceSizes: [''],
};

export default function AddProductModal({ storeId, onSave, onClose }) {
  const [forms, setForms] = useState([initialForm]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null); // { pIdx, iIdx, isUnique }

  const setForm = (idx, field, value) => {
    setForms(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const toggleUnique = (idx, checked) => {
    setForms(prev => {
      const copy = [...prev];
      if (checked) {
        copy[idx] = {
          ...copy[idx],
          is_unique: true,
          deviceIds: copy[idx].deviceId ? [copy[idx].deviceId, ''] : [''],
          deviceSizes: copy[idx].deviceSize ? [copy[idx].deviceSize, ''] : ['', ''],
          deviceId: '',
          deviceSize: '',
          purchase_qty: '',
        };
      } else {
        copy[idx] = {
          ...copy[idx],
          is_unique: false,
          deviceId: copy[idx].deviceIds[0] || '',
          deviceSize: copy[idx].deviceSizes[0] || '',
          deviceIds: [''],
          deviceSizes: [''],
        };
      }
      return copy;
    });
  };

  const addIdRow = (idx) => {
    setForms(prev => {
      const copy = [...prev];
      copy[idx].deviceIds.push('');
      copy[idx].deviceSizes.push('');
      return copy;
    });
  };

  const removeIdRow = (pIdx, iIdx) => {
    setForms(prev => {
      const copy = [...prev];
      copy[pIdx].deviceIds.splice(iIdx, 1);
      copy[pIdx].deviceSizes.splice(iIdx, 1);
      return copy;
    });
  };

  const openScanner = (pIdx, iIdx, isUnique) => {
    setScannerTarget({ pIdx, iIdx, isUnique });
    setScannerOpen(true);
  };
const handleScan = (code) => {
  const trimmed = String(code).trim();
  if (!trimmed || !scannerTarget) return;

  const { pIdx, isUnique } = scannerTarget;

  if (isUnique) {
    setForms(prev => {
      const copy = [...prev];
      const product = copy[pIdx];

        if (product.deviceIds.some(v => v.toLowerCase() === trimmed.toLowerCase())) {
        toastError("Duplicate ID in this product");
        return prev;
      }

      // Remove trailing empty row if it exists
      if (product.deviceIds[product.deviceIds.length - 1] === '') {
        product.deviceIds.pop();
        product.deviceSizes.pop();
      }

      // Append the scanned value as a new row
      product.deviceIds.push(trimmed);
      product.deviceSizes.push(''); // empty size for new row

      // Always keep one empty row at the end
      product.deviceIds.push('');
      product.deviceSizes.push('');

      return copy;
    });
  } else {
    // Non-unique: overwrite single generic deviceId
    setForm(pIdx, "deviceId", trimmed);
  }
};

  const submit = async (e) => {
    e.preventDefault();

    for (const p of forms) {
      if (!p.name.trim()) return toastError('Product name required');
      if (p.is_unique) {
        const ids = p.deviceIds.filter(Boolean);
        if (!ids.length) return toastError('Add at least one unique ID');
        if (new Set(ids.map(i => i.toLowerCase())).size < ids.length)
          return toastError('Duplicate IDs inside product');
      } else {
        if (!Number(p.purchase_qty) || Number(p.purchase_qty) <= 0)
          return toastError('Quantity required');
      }
    }

    const payload = forms.map(p => {
      let qty = 0, imei = null, size = null, devId = null;
      if (p.is_unique) {
        const ids = p.deviceIds.filter(Boolean);
        qty = ids.length;
        imei = ids.join(',');
        size = p.deviceSizes.slice(0, ids.length).join(',');
      } else {
        qty = Number(p.purchase_qty);
        devId = p.deviceId?.trim() || null;
        size = p.deviceSize?.trim() || null;
      }
      return {
        store_id: storeId,
        name: p.name.trim(),
        description: p.description?.trim(),
        purchase_price: Number(p.purchase_price) || 0,
        purchase_qty: qty,
        selling_price: Number(p.selling_price) || 0,
        suppliers_name: p.suppliers_name?.trim(),
        is_unique: p.is_unique,
        dynamic_product_imeis: imei,
        device_size: size,
        device_id: devId,
      };
    });

    try {
      await onSave(payload);
      onClose();
    } catch (_) {}
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 overflow-auto z-50">
        <form onSubmit={submit} className="bg-white dark:bg-gray-900 p-6 rounded w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4">
          <h2 className="text-xl font-bold text-center">Add Products</h2>

          {forms.map((p, pi) => (
            <div key={pi} className="border p-4 rounded space-y-3">
              {forms.length > 1 && (
                <button
                  type="button"
                  onClick={() => setForms(f => f.filter((_, i) => i !== pi))}
                  className="text-red-600 flex items-center gap-1"
                >
                  <FaTrashAlt /> Remove
                </button>
              )}

              <input
                placeholder="Name *"
                value={p.name}
                onChange={e => setForm(pi, 'name', e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                placeholder="Description"
                value={p.description}
                onChange={e => setForm(pi, 'description', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                placeholder="Supplier"
                value={p.suppliers_name}
                onChange={e => setForm(pi, 'suppliers_name', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Purchase price"
                value={p.purchase_price}
                onChange={e => setForm(pi, 'purchase_price', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Selling price"
                value={p.selling_price}
                onChange={e => setForm(pi, 'selling_price', e.target.value)}
                className="w-full p-2 border rounded"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.is_unique}
                  onChange={e => toggleUnique(pi, e.target.checked)}
                />
                <span>Unique items (IMEI/Serial)</span>
              </label>

              {!p.is_unique && (
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity *"
                  value={p.purchase_qty}
                  onChange={e => setForm(pi, 'purchase_qty', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              )}

              {/* UNIQUE ITEMS */}
              {p.is_unique && (
                <div className="space-y-2 border-t pt-2">
                  {p.deviceIds.map((id, ii) => (
                    <div key={ii} className="flex gap-2 items-center">
                      <input
                        value={id}
                        onChange={e => {
                          const value = e.target.value.trim();
                          setForms(prev => {
                            const copy = [...prev];

                            // Duplicate check
                            if (value && hasDuplicateDeviceId(copy, value, pi, ii)) {
                              toastError("Duplicate ID detected!");
                              return prev;
                            }

                            copy[pi].deviceIds[ii] = value;
                            return copy;
                          });
                        }}
                        placeholder="IMEI/Serial"
                        className="flex-1 p-2 border rounded"
                      />
                      <input
                        value={p.deviceSizes[ii] || ''}
                        onChange={e => {
                          const value = e.target.value;
                          setForms(prev => {
                            const copy = [...prev];
      copy[pi] = { ...copy[pi] }; // copy product
      copy[pi].deviceSizes = [...copy[pi].deviceSizes]; // copy deviceSizes array
      copy[pi].deviceSizes[ii] = value; // update the correct index
                            return copy;
                          });
                        }}
                        placeholder="Size"
                        className="w-24 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => openScanner(pi, ii, true)}
                        className="p-3 text-indigo-600 rounded-lg hover:bg-indigo-100"
                      >
                        <FaCamera />
                      </button>
                      {p.deviceIds.length > 1 && ii < p.deviceIds.length - 1 && (
                        <button
                          type="button"
                          onClick={() => removeIdRow(pi, ii)}
                          className="p-3 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTrashAlt />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add another ID button at bottom-left */}
                  <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => addIdRow(pi)}
                    className="text-indigo-600 text-sm"
                  >
                    + Add another ID
                  </button>
                </div>
                </div>
              )}

              {/* NON-UNIQUE */}
              {!p.is_unique && (
                <div className="flex gap-2">
                  <input
                    value={p.deviceId}
                    onChange={e => setForm(pi, 'deviceId', e.target.value)}
                    placeholder="Generic barcode"
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    value={p.deviceSize}
                    onChange={e => setForm(pi, 'deviceSize', e.target.value)}
                    placeholder="Size"
                    className="w-32 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => openScanner(pi, 0, false)}
                    className="p-3 text-indigo-600 rounded-lg hover:bg-indigo-100"
                  >
                    <FaCamera />
                  </button>
                </div>
              )}

              {pi === forms.length - 1 && (
                <button
                  type="button"
                  onClick={() => setForms(f => [...f, initialForm])}
                  className="text-indigo-600 text-sm mt-2"
                >
                  + Add another product
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded">
              Save Products
            </button>
          </div>
        </form>
      </div>

      {/* SCANNER MODAL */}
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
