import React from 'react';
import { FaPlus, FaTrash, FaQrcode } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { supabase } from '../../supabaseClient';

const SalesFormModal = ({
  type,
  onClose,
  lines,
  setLines,
  paymentMethod,
  setPaymentMethod,
  selectedCustomerId,
  setSelectedCustomerId,
  emailReceipt,
  setEmailReceipt,
  currency,
  openScanner,
  addDeviceId,
  products,
  inventory,
  validateAndFetchDevice,
  hasDuplicateDeviceId,
  sale,              // for edit
  saleForm,
  setSaleForm,
}) => {
  const isEdit = type === 'edit';

  const currentLines = isEdit ? [saleForm] : lines;
  const setCurrentLines = isEdit ? setSaleForm : setLines;

  const totalAmount = currentLines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unit_price || 0), 0);



  const handleLineChange = (lineIdx, field, value, deviceIdx = null) => {
    setCurrentLines(prev => {
      const next = [...prev];
      if (field === 'dynamic_product_id') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) {
          next[lineIdx].unit_price = prod.selling_price;
          next[lineIdx].dynamic_product_id = prod.id;
        }
      } else if (field === 'quantity') {
        next[lineIdx].quantity = Number(value) || 1;
      } else if (field === 'unit_price') {
        next[lineIdx].unit_price = Number(value) || 0;
      } else if (field === 'deviceIds' && deviceIdx !== null) {
        next[lineIdx].deviceIds[deviceIdx] = value;
      }
      return next;
    });
  };


  

  const handleSubmit = async () => {
    try {
      const storeId = localStorage.getItem('store_id');
      const ownerId = localStorage.getItem('owner_id');
      const userId = localStorage.getItem('user_id');
  
      const saleData = isEdit ? saleForm : lines.map(l => ({
        ...l,
        payment_method: paymentMethod,
        customer_id: selectedCustomerId || null,
      }));
  
      // Validation
      for (const line of saleData) {
        if (!line.dynamic_product_id || line.quantity <= 0 || line.unit_price <= 0) {
          toast.error('Please fill all required fields');
          return;
        }
      }
  
      if (isEdit) {
        const { error } = await supabase
          .from('dynamic_sales')
          .update({
            store_id: storeId,
            owner_id: ownerId,
            user_id: userId,
            quantity: saleForm.quantity,
            unit_price: saleForm.unit_price,
            device_id: saleForm.deviceIds.filter(Boolean).join(','),
            device_size: saleForm.deviceSizes.filter(Boolean).join(','),
            payment_method: paymentMethod,
            customer_id: selectedCustomerId,
          })
          .eq('id', sale.id);
  
        if (error) throw error;
        toast.success('Sale updated!');
      } else {
        const { error } = await supabase
          .from('dynamic_sales')
          .insert(
            saleData.map(l => ({
              store_id: storeId,
              owner_id: ownerId,
              user_id: userId,
              dynamic_product_id: l.dynamic_product_id,
              quantity: l.quantity,
              unit_price: l.unit_price,
              amount: l.quantity * l.unit_price,
              device_id: l.deviceIds.filter(Boolean).join(',') || null,
              device_size: l.deviceSizes.filter(Boolean).join(',') || null,
              payment_method: paymentMethod,
              customer_id: selectedCustomerId,
            }))
          );
  
        if (error) throw error;
        toast.success('Sale created!');
  
        setLines([
          {
            dynamic_product_id: '',
            quantity: 1,
            unit_price: '',
            deviceIds: [''],
            deviceSizes: [''],
            isQuantityManual: false,
          },
        ]);
      }
  
      onClose();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Sale' : 'New Sale'}</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option>Cash</option>
              <option>Card</option>
              <option>Mobile Money</option>
              <option>Bank Transfer</option>
            </select>

            <input
              type="text"
              placeholder="Customer (optional)"
              className="px-4 py-2 border rounded-lg dark:bg-gray-700"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailReceipt}
                onChange={(e) => setEmailReceipt(e.target.checked)}
              />
              <span>Email Receipt</span>
            </label>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            {currentLines.map((line, lineIdx) => (
              <div key={lineIdx} className="border dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
              value={line.dynamic_product_id || ''}
              onChange={(e) => {
                const val = Number(e.target.value); // ensure it's a number
                handleLineChange(lineIdx, 'dynamic_product_id', val);
              }}
              className="px-4 py-2 border rounded dark:bg-gray-700"
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.id} value={Number(p.id)}>{p.name}</option>
              ))}
            </select>


                  <input
                    type="number"
                    value={line.quantity || 1}
                    onChange={(e) => handleLineChange(lineIdx, 'quantity', e.target.value)}
                    className="px-4 py-2 border rounded dark:bg-gray-700"
                    min="1"
                  />

                  <input
                    type="number"
                    value={line.unit_price || ''}
                    onChange={(e) => handleLineChange(lineIdx, 'unit_price', e.target.value)}
                    className="px-4 py-2 border rounded dark:bg-gray-700"
                    step="0.01"
                  />

                  <div className="font-bold text-lg">
                    {currency.symbol}{(line.quantity * line.unit_price || 0).toFixed(2)}
                  </div>
                </div>

                {/* Device IDs */}
                <div className="space-y-2">
                  {line.deviceIds?.map((id, devIdx) => (
                    <div key={devIdx} className="flex gap-2">
                      <input
                        type="text"
                        value={id}
                        onChange={(e) => handleLineChange(lineIdx, 'deviceIds', e.target.value, devIdx)}
                        placeholder="Device ID / IMEI"
                        className="flex-1 px-3 py-2 border rounded dark:bg-gray-700"
                      />
                      <button
                        onClick={() => openScanner(isEdit ? 'edit' : 'add', lineIdx, devIdx)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        <FaQrcode />
                      </button>
                      {devIdx > 0 && (
                        <button
                          onClick={() => setCurrentLines(prev => {
                            const next = [...prev];
                            next[lineIdx].deviceIds.splice(devIdx, 1);
                            next[lineIdx].deviceSizes.splice(devIdx, 1);
                            return next;
                          })}
                          className="px-3 py-2 bg-red-600 text-white rounded"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addDeviceId(lineIdx)}
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FaPlus /> Add Device ID
                  </button>
                </div>
              </div>
            ))}

            {!isEdit && (
              <button
                onClick={() => setLines(prev => [...prev, {
                  dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], deviceSizes: [''], isQuantityManual: false
                }])}
                className="text-indigo-600 hover:underline"
              >
                + Add Another Item
              </button>
            )}
          </div>

          <div className="text-right text-2xl font-bold">
            Total: {currency.symbol}{totalAmount.toFixed(2)}
          </div>
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {isEdit ? 'Save Changes' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesFormModal;