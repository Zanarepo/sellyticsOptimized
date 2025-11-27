// src/components/debts/useDebt.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export default function useDebt() {
  const storeId = localStorage.getItem("store_id");

  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [showDetail, setShowDetail] = useState(null);

  // SCANNER STATE
  const [showScanner, setShowScanner] = useState(false);
  const [scannerCallback, setScannerCallback] = useState(null); 

  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const fetchDebts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('debts') // Assuming your table name is 'debts' (common convention) or 'debts'
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      addNotification('Failed to load debts: ' + error.message, 'error');
    } else {
      const formatted = data.map(d => ({
        ...d,
        deviceIds: d.device_id?.split(',').map(s => s.trim()).filter(Boolean) || [],
        deviceSizes: d.device_sizes?.split(',').map(s => s.trim()).filter(Boolean) || [],
      }));
      setDebts(formatted);
      setFilteredDebts(formatted);
    }
  }, [storeId, addNotification]);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  // Search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDebts(debts);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredDebts(debts.filter(d =>
      [d.customer_name, d.product_name, d.phone_number, ...(d.deviceIds || [])]
        .some(field => field?.toLowerCase().includes(term))
    ));
  }, [searchTerm, debts]);


  // --- NEW: debts Deletion Function ---
  const deleteDebtFromDatabase = useCallback(async (debtId) => {
      if (!debtId) {
          addNotification('Deletion failed: Invalid debts ID.', 'error');
          return;
      }
      
      try {
          // Use 'debts' as the table name, matching the one used in fetchDebts
          const { error } = await supabase
              .from('debts') 
              .delete()
              .eq('id', debtId);

          if (error) {
              console.error("Supabase delete error:", error);
              // Note: Success notification for the user is handled in DebtTable.jsx (via toastSuccess)
              throw new Error(error.message); 
          }
          
          // Refresh the list immediately after successful deletion
          fetchDebts(); 
          
          // Return a non-error status for the DebtTable component's try/catch to proceed
          return { success: true }; 
          
      } catch (err) {
          // The error caught here is usually only if the database call fails
          addNotification(`Failed to delete debts: ${err.message}`, 'error');
          // Re-throw the error so DebtTable knows the operation failed
          throw err; 
      }
  }, [addNotification, fetchDebts]);
  // --- END NEW: debts Deletion Function ---


  // SCANNER CONTROL 
  const openScanner = useCallback((onSuccessCallback) => {
    if (typeof onSuccessCallback !== 'function') {
      addNotification('Scanner error: invalid callback', 'error');
      return;
    }
    setScannerCallback(() => onSuccessCallback);
    setShowScanner(true);
    addNotification('Scanner opened — point at barcode/IMEI', 'info');
  }, [addNotification]);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScannerCallback(null);
    addNotification('Scanner closed', 'info');
  }, [addNotification]);

  const handleScanSuccess = useCallback((code) => {
    if (scannerCallback) {
      scannerCallback(code.trim());
    }
    closeScanner();
    addNotification(`Scanned: ${code.trim()}`, 'success');
  }, [scannerCallback, closeScanner, addNotification]);

  return {
    filteredDebts,
    searchTerm,
    setSearchTerm,
    editing,
    setEditing,
    showDetail,
    setShowDetail,

    // SCANNER
    showScanner,
    openScanner,        
    handleScanSuccess,  
    closeScanner,       

    notifications,
    addNotification,
    fetchDebts,
    // *** FIX: Export the new delete function ***
    deleteDebtFromDatabase, 
  };
}