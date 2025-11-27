// src/components/Debts/EditDebtModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FaCamera, FaPlus, FaTrash, FaSave, FaTimes, FaBalanceScale } from 'react-icons/fa'; 
import { supabase } from '../../supabaseClient';
import ScannerModal from '../products/ScannerModal';
import {hasDuplicateDeviceId } from '../../utils/deviceValidation';
import { toastError, toastSuccess } from '../products/toastError';
import useDebt from './useDebt';

export default function EditDebtModal({ initialData, onClose, onSuccess }) {
  const { addNotification } = useDebt();
  const storeId = localStorage.getItem("store_id");
  const isEdit = !!initialData?.id;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultEntry = {
    customer_id: "",
    customer_name: "",
    phone_number: "",
    dynamic_product_id: "",
    product_name: "",
    supplier: "",
    deviceIds: [""] /* Single empty field for new entry */,
    deviceSizes: [""] /* Single empty field for new entry */,
    qty: 1, 
    owed: "", 
    deposited: 0,
    date: new Date().toISOString().split('T')[0],
    isUniqueProduct: true,
  };

  const [debtEntries, setDebtEntries] = useState([defaultEntry]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);

  // --- Data Loading Effect ---
  useEffect(() => {
    const loadData = async () => {
      const [{ data: c, error: cError }, { data: p, error: pError }] = await Promise.all([
        supabase.from('customer').select('id, fullname, phone_number').eq('store_id', storeId),
        // Ensure selling_price is fetched
        supabase.from('dynamic_product').select('id, name, dynamic_product_imeis, selling_price').eq('store_id', storeId),
      ]);

      if (cError) console.error("Error loading customers:", cError);
      if (pError) console.error("Error loading products:", pError);

      setCustomers(c || []);
      setProducts(p || []);
    };
    loadData();
  }, [storeId]);

  // --- Edit Data Loading Effect ---
  useEffect(() => {
    if (isEdit && initialData) {
      const hasImeis = initialData.device_id && initialData.device_id.trim() !== '';
      setDebtEntries([{
        ...initialData,
        customer_id: initialData.customer_id || "",
        dynamic_product_id: initialData.dynamic_product_id || "",
        // Ensure at least one empty string if it's unique but IDs are missing
        deviceIds: initialData.device_id ? initialData.device_id.split(',').map(s => s.trim()).filter(s => s !== '') : [""] ,
        deviceSizes: initialData.device_sizes ? initialData.device_sizes.split(',').map(s => s.trim()).filter(s => s !== '') : [""] ,
        qty: initialData.qty || 1,
        owed: initialData.owed || "",
        deposited: initialData.deposited || 0,
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        isUniqueProduct: hasImeis,
      }]);
    }
  }, [initialData, isEdit]);

  // --- Calculate Balance (Memoized for efficiency) ---
  const calculatedDebts = useMemo(() => {
    return debtEntries.map(entry => {
      const owed = parseFloat(entry.owed) || 0;
      const deposited = parseFloat(entry.deposited) || 0;
      const remaining_balance = owed - deposited;
      return {
        ...entry,
        // Ensure remaining_balance is formatted for UI
        remaining_balance: remaining_balance.toFixed(2),
      };
    });
  }, [debtEntries]);


  // --- Handlers ---
  const handleChange = (index, field, value) => {
    const updated = [...debtEntries];
    updated[index][field] = value;

    if (field === 'customer_id') {
      const cust = customers.find(c => c.id === parseInt(value));
      updated[index].customer_name = cust ? cust.fullname : "";
    
    }
    
    if (field === 'dynamic_product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      if (prod) {
        updated[index].product_name = prod.name;
        
        const sellingPrice = parseFloat(prod.selling_price) || 0;
        const isUnique = prod.dynamic_product_imeis && prod.dynamic_product_imeis.trim() !== '';
        updated[index].isUniqueProduct = isUnique;

        if (isUnique) {
             const actualIds = updated[index].deviceIds.filter(id => id.trim() !== '');
             updated[index].qty = actualIds.length > 0 ? actualIds.length : 1;
             // Set owed based on 1 item price initially (for unique)
             updated[index].owed = sellingPrice.toFixed(2);
        } else {
             if (!updated[index].qty) updated[index].qty = 1;
             const newOwed = parseFloat(updated[index].qty || 0) * sellingPrice;
             updated[index].owed = newOwed.toFixed(2); 
             // Clear device specific fields for non-unique
             updated[index].deviceIds = [];
             updated[index].deviceSizes = [];
        }
        
      } else {
         updated[index].product_name = "";
         updated[index].isUniqueProduct = true;
         updated[index].owed = "";
      }
    }
// src/components/Debts/EditDebtModal.jsx

// ... (inside handleChange function)

if (field === 'qty') {
    const currentQty = parseFloat(value || 0);

    if (updated[index].isUniqueProduct) {
        const actualIds = updated[index].deviceIds.filter(id => id.trim() !== '');
        updated[index].qty = actualIds.length > 0 ? actualIds.length : 1; 
        addNotification("Quantity for unique products is determined by the number of Device IDs.", 'warning');
    } else if (updated[index].dynamic_product_id) {
        // Logic for non-unique product quantity change
        const prod = products.find(p => p.id === parseInt(updated[index].dynamic_product_id));
        if (prod) {
            const sellingPrice = parseFloat(prod.selling_price) || 0;
            const newOwed = currentQty * sellingPrice;
            // FIX: Corrected the variable name from newOowed to newOwed
            updated[index].owed = newOwed.toFixed(2); // Auto-populate owed
        }
    }
}

// ...

    setDebtEntries(updated);
  };

  const addDebtEntry = () => {
    if (!isEdit) {
      setDebtEntries([...debtEntries, defaultEntry]);
    }
  };

  const removeDebtEntry = (index) => {
    if (isEdit || calculatedDebts.length === 1) return;
    setDebtEntries(debtEntries.filter((_, i) => i !== index));
  };

  const handleDeviceIdChange = (entryIdx, deviceIdx, value) => {
    const cleanValue = value.trim();

    // ←←← ONLY THIS BLOCK ADDED ←←←
    if (cleanValue !== "") {
      const allExistingIds = debtEntries
        .flatMap(entry => entry.deviceIds)
        .map(id => id.trim())
        .filter(id => id !== "");

      if (allExistingIds.includes(cleanValue)) {
        toastError("Duplicate exists");
        return; // Stop here — don't allow duplicate
      }
    }
    // ←←← END OF ADDED BLOCK ←←←

    const updated = [...debtEntries];
    updated[entryIdx].deviceIds[deviceIdx] = value;
    
    const lastIdx = updated[entryIdx].deviceIds.length - 1;
    if (deviceIdx === lastIdx && value.trim() !== '') {
        updated[entryIdx].deviceIds.push("");
        updated[entryIdx].deviceSizes.push("");
    }

    const actualIds = updated[entryIdx].deviceIds.filter(id => id.trim() !== '');
    updated[entryIdx].qty = actualIds.length > 0 ? actualIds.length : 1; 

    setDebtEntries(updated);
};



  const handleDeviceSizeChange = (entryIdx, deviceIdx, value) => {
      const updated = [...debtEntries];
      updated[entryIdx].deviceSizes[deviceIdx] = value;
      setDebtEntries(updated);
  };


  const removeDeviceField = (entryIdx, deviceIdx) => {
    const updated = [...debtEntries];
    updated[entryIdx].deviceIds.splice(deviceIdx, 1);
    updated[entryIdx].deviceSizes.splice(deviceIdx, 1);

    if (updated[entryIdx].deviceIds.length === 0) {
      updated[entryIdx].deviceIds = [""];
      updated[entryIdx].deviceSizes = [""];
    }
    
    const actualIds = updated[entryIdx].deviceIds.filter(id => id.trim() !== '');
    updated[entryIdx].qty = actualIds.length > 0 ? actualIds.length : 1; 

    setDebtEntries(updated);
  };

  // --- Scanner Handlers Restored ---
  const openScanner = (entryIndex, deviceIndex) => {
    setScannerTarget({ entryIndex, deviceIndex });
    setShowScanner(true);
  };

  const handleScanSuccess = (scannedCode) => {
    const cleanCode = scannedCode?.trim();
    if (!cleanCode) return;
    if (!scannerTarget || typeof scannerTarget !== 'object') return;
  
    const { entryIndex } = scannerTarget;
  
    // NEW: CHECK FOR DUPLICATE IN CURRENT DEBT (ONLY ADDED PART)

    const isDuplicate = hasDuplicateDeviceId(debtEntries, cleanCode, entryIndex);
  if (isDuplicate) {
    toastError(`Duplicate Product ID: ${cleanCode} already added`);
    return;
  }
    setDebtEntries(prevEntries => {
      // Create a fresh copy of all entries
      const updatedEntries = [...prevEntries];
  
      // Make sure the entry exists
      if (!updatedEntries[entryIndex]) return prevEntries;
  
      const currentEntry = { ...updatedEntries[entryIndex] };
      const currentIds = currentEntry.deviceIds || [];
      const currentSizes = currentEntry.deviceSizes || [];
  
      // ADD NEW ROW (not replace!)
      const newIds = [...currentIds, cleanCode];
      const newSizes = [...currentSizes, ""];  // empty size for new row
  
      // Update quantity
      const filledCount = newIds.filter(id => id.trim() !== '').length;
      currentEntry.qty = filledCount > 0 ? filledCount : 1;
  
      // Save back
      currentEntry.deviceIds = newIds;
      currentEntry.deviceSizes = newSizes;
  
      updatedEntries[entryIndex] = currentEntry;
  
      return updatedEntries;
    });
    toastSuccess(`Added: ${cleanCode}`);
  };
  

  const saveDebts = async () => {
    if (isLoading) return;
  
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
  
    for (let i = 0; i < calculatedDebts.length; i++) {
      const entry = calculatedDebts[i];
      const entryName = entry.product_name || `Entry ${i + 1}`;
  
      // Skip incomplete entries
      if (!entry.customer_id || !entry.dynamic_product_id || !entry.owed || 
          (entry.isUniqueProduct && entry.deviceIds.filter(id => id.trim() !== '').length === 0)) {
        addNotification(`${entryName} skipped (incomplete fields): Customer, Product, Owed amount, and Device IDs (if unique) are required.`, 'error');
        errorCount++;
        continue;
      }
  
      const finalDeviceIds = entry.deviceIds.map(s => s.trim()).filter(s => s !== '');
      const finalDeviceSizes = entry.deviceSizes.map(s => s.trim()).filter(s => s !== ''); // ← Fixed typo
  
      const remainingBalance = parseFloat(entry.remaining_balance) || 0;
      const isPaid = remainingBalance <= 0;
  
      const payload = {
        store_id: storeId,
        customer_id: parseInt(entry.customer_id),
        dynamic_product_id: parseInt(entry.dynamic_product_id),
        customer_name: entry.customer_name,
      
        product_name: entry.product_name,
        supplier: entry.supplier || null,
        device_id: finalDeviceIds.join(', '),
        device_sizes: finalDeviceSizes.join(', '),
        qty: finalDeviceIds.length > 0 ? finalDeviceIds.length : (entry.qty || 1),
        owed: parseFloat(entry.owed),
        deposited: parseFloat(entry.deposited || 0),
        remaining_balance: remainingBalance,
        date: entry.date,
        is_paid: isPaid,
      };
  
      let result;
      if (isEdit) {
        result = await supabase.from('debts').update(payload).eq('id', initialData.id);
      } else {
        result = await supabase.from('debts').insert(payload);
      }
  
      if (result.error) {
        console.error('Supabase Error:', result.error);
        toastError("Failed to save debt");
        errorCount++;
      } else {
        toastSuccess("Debt created");
        successCount++;
      }
    }
  
    setIsLoading(false);
  
    // Final summary
    if (successCount > 0) {
      addNotification(`${successCount} debt entry(s) saved successfully!`, 'success');
      onSuccess?.(); // Safe call
    } else if (errorCount > 0) {
      addNotification('Some entries failed to save. Check required fields.', 'error');
    }
  };
  // --- END Save Logic Implementation ---


  return (
    <>
      {/* Modal Backdrop and Container */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[98vh] overflow-y-auto mt-4 mb-4 p-4 sm:p-8">
          
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-indigo-600">
            {isEdit ? '📝 Edit Debt Entry' : 'Record New Debt'}
          </h2>

          {calculatedDebts.map((entry, index) => (
            <div 
              key={index} 
              className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 sm:p-6 mb-6 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">
                  {isEdit ? 'Debt Details' : `Entry ${index + 1}`}
                </h3>
                {calculatedDebts.length > 1 && !isEdit && (
                  <button 
                    onClick={() => removeDebtEntry(index)} 
                    className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors"
                    title="Remove Entry"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              {/* Main Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Customer Select */}
                <div className='col-span-1 sm:col-span-2 md:col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Customer</label>
                    <select
                        value={entry.customer_id}
                        onChange={(e) => handleChange(index, 'customer_id', e.target.value)}
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.fullname} </option>)}
                    </select>
                </div>

                {/* Product Select */}
                <div className='col-span-1 sm:col-span-2 md:col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Product</label>
                    <select
                        value={entry.dynamic_product_id}
                        onChange={(e) => handleChange(index, 'dynamic_product_id', e.target.value)}
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        required
                    >
                        <option value="">Select Product</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Price: {p.selling_price || 0})
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Quantity */}
                <div className='col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Quantity</label>
                    <input 
                        type="number" 
                        placeholder="Quantity" 
                        min="1"
                        value={entry.qty} 
                        onChange={(e) => handleChange(index, 'qty', e.target.value)} 
                        className={`w-full p-3 border rounded-lg ${entry.isUniqueProduct && entry.dynamic_product_id ? 'bg-gray-200 dark:bg-gray-700 opacity-70 cursor-not-allowed' : ''}`}
                        required 
                        disabled={entry.isUniqueProduct && entry.dynamic_product_id !== ""} 
                        title={entry.isUniqueProduct ? "Quantity is derived from Device IDs." : "Enter quantity."}
                    />
                </div>

                {/* Amount Owed */}
                <div className='col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Amount Owed (Editable)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Total Owed" 
                        value={entry.owed} 
                        onChange={(e) => handleChange(index, 'owed', e.target.value)} 
                        className={`w-full p-3 border rounded-lg`} 
                        required 
                    />
                </div>
                
                {/* Deposited */}
                <div className='col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Amount Deposited</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Deposited" 
                        value={entry.deposited} 
                        onChange={(e) => handleChange(index, 'deposited', e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                    />
                </div>

                {/* Balance (New Read-only Field) */}
                <div className='col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Remaining Balance</label>
                    <div className={`w-full p-3 border rounded-lg font-bold text-center flex items-center justify-center gap-2 
                        ${entry.remaining_balance === '0.00' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}
                        title="Owed - Deposited"
                    >
                        <FaBalanceScale className='h-4 w-4' /> {entry.remaining_balance}
                    </div>
                </div>

                {/* Date */}
                <div className='col-span-1 sm:col-span-2 md:col-span-1'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Date</label>
                    <input 
                        type="date" 
                        value={entry.date} 
                        onChange={(e) => handleChange(index, 'date', e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                        required 
                    />
                </div>
                
                {/* Supplier (Optional) */}
                <div className='col-span-1 sm:col-span-2 md:col-span-2'>
                    <label className='block text-sm font-medium mb-1 dark:text-gray-300'>Supplier (Optional)</label>
                    <input 
                        placeholder="Supplier" 
                        value={entry.supplier} 
                        onChange={(e) => handleChange(index, 'supplier', e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                    />
                </div>
              </div>

              {/* Device IDs - Only show if product is Unique */}
              {entry.isUniqueProduct && entry.dynamic_product_id && (
                <div className="mt-6 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <FaCamera className='h-4 w-4' /> Unique Product Tracking ({entry.qty} ID{entry.qty !== 1 ? 's' : ''})
                  </h4>
                  
                  {/* Device ID List */}
                  {entry.deviceIds.map((id, dIdx) => (
                    <div key={dIdx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 items-center">
                      <input
                        value={id}
                        onChange={(e) => handleDeviceIdChange(index, dIdx, e.target.value)}
                        placeholder={`Device ID / IMEI #${dIdx + 1}`}
                        className="flex-1 w-full p-3 border rounded-lg text-sm"
                      />
                      <input
                        value={entry.deviceSizes[dIdx] || ''}
                        onChange={(e) => handleDeviceSizeChange(index, dIdx, e.target.value)}
                        placeholder="Size (Optional)"
                        className="w-full sm:w-32 p-3 border rounded-lg text-sm"
                      />
                      
                      {/* Scanner Button (Restored) */}
                      <button
                        onClick={() => openScanner(index, dIdx)}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                        title="Scan IMEI/Barcode"
                      >
                        <FaCamera className='h-4 w-4' />
                      </button>

                      {/* Remove Button */}
                      {(entry.deviceIds.length > 1 && id.trim() !== '') || (entry.deviceIds.length > 1 && dIdx < entry.deviceIds.length - 1) ? (
                          <button
                            onClick={() => removeDeviceField(index, dIdx)}
                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                            title="Remove Device ID"
                          >
                            <FaTimes className='h-4 w-4' />
                          </button>
                      ) : (
                           entry.deviceIds.length > 1 && <div className='p-3 w-8 h-8 sm:w-10 sm:h-10 invisible'></div>
                      )}

                    </div>
                  ))}
                  
                </div>
              )}

              {!entry.isUniqueProduct && entry.dynamic_product_id && (
                <p className="mt-4 p-3 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold rounded-lg text-center">
                  ✅ Non-Unique Product – Total Owed is calculated as Price * Quantity.
                </p>
              )}
            </div>
          ))}

          {/* Add Another Entry - Only for Create Mode */}
          {!isEdit && (
            <button
              onClick={addDebtEntry}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-3 transition-colors duration-200 mt-6 mb-4 border border-dashed border-gray-400 dark:border-gray-600"
              title="Add a new line item"
            >
              <FaPlus /> Add Line Item
            </button>
          )}

<div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t dark:border-gray-700">
  {/* Cancel Button */}
  <button
    onClick={onClose}
    disabled={isLoading}
    className="w-full sm:w-auto px-5 py-3 text-red-600 dark:text-red-400 font-medium 
               border border-red-200 dark:border-red-800/50 rounded-lg 
               hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
               disabled:opacity-50"
  >
            Cancel
        </button>

        {/* Save Button */}
        <button
            onClick={saveDebts}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white 
                    font-medium rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
        >
            {isLoading ? (
            <>Saving...</>
            ) : (
            <>
                <FaSave />
                {isEdit ? 'Update Debt' : 'Save Debt'}
            </>
            )}
        </button>
        </div>
        </div>
      </div>

      {showScanner && (
  <ScannerModal
    isOpen={showScanner}
    onScan={handleScanSuccess}
    onClose={() => setShowScanner(false)}   // Only manual close
  />
)}

</>
  );
}