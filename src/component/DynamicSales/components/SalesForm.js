import React from 'react';
import CustomerSelector from '../CustomerSelector';
import { FaTrashAlt, FaCamera } from 'react-icons/fa';


export default function SalesForm({
  type,
  onSubmit,
  onCancel,
  lines,
  setLines,
  removeLine,
  products = [],
  handleLineChange,
  availableDeviceIds = [],
  openScanner,
  removeDeviceId,
  addDeviceId,
  paymentMethod,
  setPaymentMethod,
  storeId,
  selectedCustomerId,
  setSelectedCustomerId,
  totalAmount = 0,
  saleForm = {},
  handleEditChange,
  addEditDeviceId,
  removeEditDeviceId,
  emailReceipt,        // from parent
  setEmailReceipt,     // from parent
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      lines: type === 'add' ? lines : undefined,
      saleForm: type === 'edit' ? saleForm : undefined,
      paymentMethod,
      storeId,
      selectedCustomerId,
      totalAmount,
      emailReceipt,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 dark:text-gray-200">
        {type === 'add' ? 'Add Sale' : 'Edit Sale'}
      </h2>

      {/* ====== ADD MODE ====== */}
      {type === 'add' && (lines || []).map((line, lineIdx) => (
        <div key={lineIdx} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-3 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Item {lineIdx + 1}</h3>
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(lineIdx)} className="p-2 bg-red-600 text-white rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {[
            { name: 'dynamic_product_id', label: 'Product', type: 'select' },
            { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
            { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01' },
          ].map(f => (
            <label key={f.name} className="block">
              <span className="font-semibold text-sm">{f.label}</span>
              {f.type === 'select' ? (
                <select
                  value={line[f.name] || ''}
                  onChange={e => handleLineChange(lineIdx, f.name, e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  required
                >
                  <option value="">Select...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={line[f.name] || ''}
                  onChange={e => handleLineChange(lineIdx, f.name, e.target.value)}
                  min={f.min}
                  step={f.step}
                  className="w-full p-2 border rounded mt-1"
                  required
                />
              )}
            </label>
          ))}

          {/* Device IDs */}
          <label className="block">
            <span className="font-semibold text-sm">Product IDs & Sizes (Optional)</span>
            {(line.deviceIds || ['']).map((id, i) => (
              <div key={i} className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={id}
                    onChange={e => handleLineChange(lineIdx, 'deviceIds', e.target.value, i)}
                    placeholder="Enter ID"
                    className="flex-1 p-2 border rounded"
                  />
                  <button type="button" onClick={() => openScanner('add', lineIdx, i)} className="p-2 bg-indigo-600 text-white rounded">
                    <FaCamera />
                  </button>
                  <button type="button" onClick={() => removeDeviceId(lineIdx, i)} className="p-2 bg-red-600 text-white rounded">
                    <FaTrashAlt />
                  </button>
                </div>
                <input
                  type="text"
                  value={(line.deviceSizes || [])[i] || ''}
                  onChange={e => handleLineChange(lineIdx, 'deviceSizes', e.target.value, i)}
                  placeholder="Size"
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <button type="button" onClick={e => addDeviceId(e, lineIdx)} className="mt-2 text-indigo-600 text-sm">
              + Add ID & Size
            </button>
          </label>

          <label className="block">
            <span className="font-semibold text-sm">Payment Method</span>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded mt-1" required>
              <option value="">Select...</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Card</option>
              <option>Wallet</option>
            </select>
          </label>

          <CustomerSelector storeId={storeId} selectedCustomerId={selectedCustomerId} onCustomerChange={setSelectedCustomerId} />
       
        </div>
      ))}

      {/* ====== EDIT MODE ====== */}
      {type === 'edit' && (
        <div className="space-y-4">
          {[
            { name: 'dynamic_product_id', label: 'Product', type: 'select' },
            { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
            { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01' },
            { name: 'payment_method', label: 'Payment Method', type: 'select' },
          ].map(f => (
            <label key={f.name} className="block">
              <span className="font-semibold text-sm">{f.label}</span>
              {f.type === 'select' ? (
                <select
                  value={saleForm[f.name] || ''}
                  onChange={e => handleEditChange(f.name, e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  {f.name === 'dynamic_product_id' ? (
                    <>
                      <option value="">Select...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </>
                  ) : (
                    <>
                      <option value="">Select...</option>
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
                      <option>Wallet</option>
                    </>
                  )}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={saleForm[f.name] || ''}
                  onChange={e => handleEditChange(f.name, e.target.value)}
                  min={f.min}
                  step={f.step}
                  className="w-full p-2 border rounded mt-1"
                />
              )}
            </label>
          ))}

          <CustomerSelector storeId={storeId} selectedCustomerId={saleForm.customer_id} onCustomerChange={v => handleEditChange('customer_id', v)} />

          {/* Device IDs in Edit */}
          <label className="block">
            <span className="font-semibold text-sm">Product IDs & Sizes</span>
            {(saleForm.deviceIds || []).map((id, i) => (
              <div key={i} className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={id}
                    onChange={e => handleEditChange('deviceIds', e.target.value, i)}
                    placeholder="Enter ID"
                    className="flex-1 p-2 border rounded"
                  />
                  <button type="button" onClick={() => openScanner('edit', 0, i)} className="p-2 bg-indigo-600 text-white rounded">
                    <FaCamera />
                  </button>
                  <button type="button" onClick={() => removeEditDeviceId(i)} className="p-2 bg-red-600 text-white rounded">
                    <FaTrashAlt />
                  </button>
                </div>
                <input
                  type="text"
                  value={(saleForm.deviceSizes || [])[i] || ''}
                  onChange={e => handleEditChange('deviceSizes', e.target.value, i)}
                  placeholder="Size"
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <button type="button" onClick={addEditDeviceId} className="mt-2 text-indigo-600 text-sm">
              + Add ID & Size
            </button>
          </label>
        </div>
      )}

      {/* ====== EMAIL RECEIPT (BOTH MODES) ====== */}
      <label className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          checked={emailReceipt}
          onChange={e => setEmailReceipt(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <span className="text-sm">Email receipt to customer</span>
      </label>

      {/* ====== FOOTER ====== */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3">
        {type === 'add' && (
          <div className="font-semibold">Total: ₦{Number(totalAmount).toFixed(2)}</div>
        )}
        {type === 'add' && (
          <button
            type="button"
            onClick={() => setLines(ls => [...ls, { dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], deviceSizes: [''] }])}
            className="px-4 py-2 bg-green-600 text-white rounded-full text-sm"
          >
            Add Item
          </button>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="p-2.5 bg-gray-500 text-white rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </div>
    </form>
  );
}