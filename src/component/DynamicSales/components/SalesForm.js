import React from 'react';
import CustomerSelector from '../CustomerSelector';
import { FaTrashAlt,  FaCamera } from 'react-icons/fa';

export default function SalesForm({
  type, // 'add' | 'edit'
  onSubmit,
  onCancel,
  lines,
  setLines,
  removeLine,
  products,
  handleLineChange,
  availableDeviceIds,
  openScanner,
  removeDeviceId,
  addDeviceId,
  paymentMethod,
  setPaymentMethod,
  storeId,
  selectedCustomerId,
  setSelectedCustomerId,
  totalAmount,
  saleForm,
  handleEditChange,
  addEditDeviceId,
  removeEditDeviceId,
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 dark:text-gray-200">
        {type === 'add' ? 'Add Sale' : `Edit Sale`}
      </h2>

      {type === 'add' && lines.map((line, lineIdx) => (
        <div key={lineIdx} className="border border-gray-200 dark:border-gray-700 p-3 sm:p-4 rounded-lg space-y-3 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-200">Sale Item {lineIdx + 1}</h3>
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(lineIdx)} className="p-1.5 sm:p-2 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors duration-200" aria-label={`Remove sale item ${lineIdx + 1}`} disabled={lines.length === 1}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {[
              { name: 'dynamic_product_id', label: 'Product', type: 'select', required: true },
              { name: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true },
              { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01', required: true },
            ].map(field => (
              <label key={field.name} className="block">
                <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                {field.type === 'select' ? (
                  <select name={field.name} value={line[field.name] || ''} onChange={(e) => handleLineChange(lineIdx, field.name, e.target.value)} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" required={field.required}>
                    <option value="">Select {field.label.toLowerCase()}…</option>
                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} value={line[field.name] || ''} onChange={(e) => handleLineChange(lineIdx, field.name, e.target.value)} min={field.min} step={field.step} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" required={field.required} />
                )}
              </label>
            ))}

            <label className="block">
              <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Product IDs and Sizes (Optional)</span>
              {line.deviceIds.map((id, deviceIdx) => (
                <div key={deviceIdx} className="flex flex-col gap-3 sm:gap-4 mt-2">
                  <select value={id} onChange={(e) => handleLineChange(lineIdx, 'deviceIds', e.target.value, deviceIdx)} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]">
                    <option value="">Select Product ID (Optional)</option>
                    {(availableDeviceIds[lineIdx]?.deviceIds || []).map((deviceId) => (
                      <option key={deviceId} value={deviceId}>{deviceId}</option>
                    ))}
                  </select>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <input type="text" value={id} onChange={(e) => handleLineChange(lineIdx, 'deviceIds', e.target.value, deviceIdx)} onBlur={(e) => handleLineChange(lineIdx, 'deviceIds', e.target.value, deviceIdx, true)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLineChange(lineIdx, 'deviceIds', e.target.value, deviceIdx, true); } }} placeholder="Or enter product ID manually" className="flex-1 p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" />
                    <div className="flex gap-2 sm:gap-3 mt-1 sm:mt-0">
                      <button type="button" onClick={() => openScanner('add', lineIdx, deviceIdx)} className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-full shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200" aria-label={`Scan barcode for product ID ${deviceIdx + 1}`}>
                      <FaCamera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                      <button type="button" onClick={() => removeDeviceId(lineIdx, deviceIdx)} className="p-2 sm:p-2.5 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors duration-200" aria-label={`Remove product ID ${deviceIdx + 1}`}>
                      <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                  <input type="text" value={line.deviceSizes[deviceIdx] || ''} onChange={(e) => handleLineChange(lineIdx, 'deviceSizes', e.target.value, deviceIdx)} placeholder="Enter Product/Goods/Device Size (Optional)" className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" />
                </div>
              ))}
              <button type="button" onClick={(e) => addDeviceId(e, lineIdx)} className="mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-semibold" aria-label={`Add product ID & size for sale item ${lineIdx + 1}`}>+ Add Product ID & Size</button>
            </label>

            <label className="block">
              <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Payment Method</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" required>
                <option value="">Select payment method…</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Wallet</option>
              </select>
            </label>

            <CustomerSelector storeId={storeId} selectedCustomerId={selectedCustomerId} onCustomerChange={setSelectedCustomerId} />
          </div>
        </div>
      ))}

      {type === 'edit' && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {[
            { name: 'dynamic_product_id', label: 'Product', type: 'select', required: true },
            { name: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true },
            { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01', required: true },
            { name: 'payment_method', label: 'Payment Method', type: 'select', required: true },
          ].map(field => (
            <label key={field.name} className="block">
              <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
              {field.type === 'select' ? (
                <select name={field.name} value={saleForm[field.name] || ''} onChange={(e) => handleEditChange(field.name, e.target.value)} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" required={field.required}>
                  {field.name === 'dynamic_product_id' ? (
                    <>
                      <option value="">Select product…</option>
                      {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </>
                  ) : (
                    <>
                      <option value="">Select payment method…</option>
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
                      <option>Wallet</option>
                    </>
                  )}
                </select>
              ) : (
                <input type={field.type} name={field.name} value={saleForm[field.name] || ''} onChange={(e) => handleEditChange(field.name, e.target.value)} min={field.min} step={field.step} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" required={field.required} />
              )}
            </label>
          ))}

          <CustomerSelector storeId={storeId} selectedCustomerId={saleForm.customer_id} onCustomerChange={(value) => handleEditChange('customer_id', value)} />

          <label className="block">
            <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Product IDs and Sizes (Optional)</span>
            {saleForm.deviceIds.map((id, deviceIdx) => (
              <div key={`edit-device-${deviceIdx}`} className="flex flex-col gap-3 sm:gap-4 mt-2">
                <select value={id} onChange={(e) => handleEditChange('deviceIds', e.target.value, deviceIdx)} className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]">
                  <option value="">Select Product ID (Optional)</option>
                  {(availableDeviceIds[0]?.deviceIds || []).map((deviceId) => (<option key={deviceId} value={deviceId}>{deviceId}</option>))}
                </select>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <input type="text" value={id} onChange={(e) => handleEditChange('deviceIds', e.target.value, deviceIdx)} placeholder="Or enter Product ID manually" className="flex-1 p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" />
                  <div className="flex gap-2 sm:gap-3 mt-1 sm:mt-0">
                    <button type="button" onClick={() => openScanner('edit', 0, deviceIdx)} className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-full shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200" aria-label={`Scan barcode for product ID ${deviceIdx + 1}`}> 
                      <FaCamera />
                    </button>
                    <button type="button" onClick={() => removeEditDeviceId(deviceIdx)} className="p-2 sm:p-2.5 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors duration-200" aria-label={`Remove product ID ${deviceIdx + 1}`}>
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
                <input type="text" value={saleForm.deviceSizes[deviceIdx] || ''} onChange={(e) => handleEditChange('deviceSizes', e.target.value, deviceIdx)} placeholder="Enter Product size (Optional)" className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm min-w-[100px]" />
              </div>
            ))}
            <button type="button" onClick={(e) => addEditDeviceId(e)} className="mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-semibold" aria-label="Add product ID and size">+ Add Product ID & Size</button>
          </label>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-4">
        {type === 'add' && (
          <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-200">Total: ₦{totalAmount.toFixed(2)}</div>
        )}
        {type === 'add' && (
          <button type="button" onClick={() => setLines((ls) => ([...ls, { dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], deviceSizes: [''], isQuantityManual: false }]))} className="p-2 sm:p-3 bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors duration-200 w-full sm:w-auto flex items-center justify-center gap-2" aria-label="Add another sale item">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm sm:text-base">Add Item</span>
          </button>
        )}

        <div className="flex justify-end gap-2 sm:gap-3">
          <button type="button" onClick={onCancel} className="p-2 sm:p-2.5 bg-gray-500 text-white rounded-full shadow-sm hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors duration-200 min-w-[40px] sm:min-w-[48px] flex items-center justify-center" aria-label="Cancel form">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button type="submit" className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-full shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200 min-w-[40px] sm:min-w-[48px] flex items-center justify-center" aria-label="Save form">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </div>
    </form>
  );
}


