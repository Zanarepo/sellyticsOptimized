import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// Utility function
const formatCurrency = (value) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ReceiptModule = () => {
  const storeId = localStorage.getItem('store_id');
 const userEmail = localStorage.getItem('user_email');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [printSaleId, setPrintSaleId] = useState(null); // Track sale ID for printing
  const [vatRate, setVatRate] = useState(0);
  const [storeInfo, setStoreInfo] = useState({ shop_name: 'Store', business_address: 'N/A', phone_number: 'N/A', email_address: 'N/A' });
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const receiptRef = useRef(null);

  // Debug receiptRef and receiptData
  useEffect(() => {
    console.log('receiptRef.current:', receiptRef.current);
    console.log('receiptData:', receiptData);
    console.log('printSaleId:', printSaleId);
  }, [receiptData, printSaleId]);
  
 // Validate storeId and userEmail
  useEffect(() => {
    if (!storeId || !userEmail) {
  
    }
  }, [storeId, userEmail]);

  // Fetch VAT and store info
  useEffect(() => {
    async function fetchVatAndStore() {
      if (!storeId) return;

      try {
        const { data: vatData, error: vatError } = await supabase
          .from('vat')
          .select('amount')
          .eq('store_id', storeId)
          .single();
        if (vatError && vatError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch VAT: ${vatError.message}`);
        }
        setVatRate((vatData?.amount || 0) / 100);

        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('shop_name, business_address, phone_number')
          .eq('id', storeId)
          .single();
        if (storeError) {
          throw new Error(`Failed to fetch store info: ${storeError.message}`);
        }
        setStoreInfo({
          shop_name: storeData?.shop_name || 'Store',
          address: storeData?.address || 'N/A',
          phone_number: storeData?.phone_number || 'N/A',
        });
      } catch (error) {
        alert(error.message);
        setVatRate(0);
        setStoreInfo({ shop_name: 'Store', address: 'N/A', phone_number: 'N/A' });
      }
    }
    fetchVatAndStore();
  }, [storeId]);

  // Check if user is admin by email
  useEffect(() => {
    async function checkAdmin() {
      if (!storeId || !userEmail) return;

      try {
        const { data, error } = await supabase
          .from('store_admins')
          .select('email')
          .eq('store_id', storeId)
          .eq('email', userEmail);
        if (error) {
          throw new Error(`Failed to check admin status: ${error.message}`);
        }
        setIsAdmin(data && data.length > 0);
      } catch (error) {
        alert(error.message);
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [storeId, userEmail]);


  // Fetch receipts list
  const itemsPerPage = 10;
  useEffect(() => {
    const fetchSalesList = async () => {
      if (!storeId) {
        alert('Store ID is missing');
        return;
      }

      try {
        let query = supabase
          .from('sale_groups')
          .select('*', { count: 'exact' })
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        // Search by sale_group_id (exact match)
        if (search) {
          const searchId = parseInt(search, 10);
          if (!isNaN(searchId)) {
            query = query.eq('id', searchId);
          }
        }

        const { data, count, error } = await query.range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );
        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(`Failed to fetch receipts list: ${error.message}`);
        }

        setSales(data || []);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } catch (error) {
        alert(`Failed to fetch receipts list: ${error.message}`);
        setSales([]);
        setTotalPages(1);
      }
    };

    const debouncedFetch = debounce(fetchSalesList, 300);
    debouncedFetch();
  }, [currentPage, search, storeId]);

  // Real-time subscription for sale_groups
  useEffect(() => {
    if (!storeId) return;

    const subscription = supabase
      .channel('sale_groups_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sale_groups', filter: `store_id=eq.${storeId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSales((prev) => prev.filter((sale) => sale.id !== payload.old.id));
          } else {
            setCurrentPage(1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [storeId]);



  

  // Load receipt data
  async function loadReceiptData(saleGroupId, callback) {
    if (!storeId) {
      alert('Store ID is missing');
      return;
    }

    try {
      const { data: group, error: groupError } = await supabase
        .from('sale_groups')
        .select('id, customer_id, created_at, total_amount, payment_method')
        .eq('id', saleGroupId)
        .eq('store_id', storeId)
        .single();
      if (groupError) throw groupError;

      const { data: items, error: itemsError } = await supabase
        .from('dynamic_sales')
        .select('*, dynamic_product(name)')
        .eq('sale_group_id', saleGroupId)
        .eq('store_id', storeId);
      if (itemsError) throw itemsError;

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const vatAmount = subtotal * vatRate;
      const total = group.total_amount;

      setReceiptData({ group, items, subtotal, vatAmount, total });
      if (callback) callback();
    } catch (error) {
      alert(`Failed to load receipt data: ${error.message}`);
      setReceiptData(null);
    }
  }

  // Delete receipt
  async function handleDelete(saleGroupId) {
    if (!isAdmin) {
      alert('Only admins can delete receipts');
      return;
    }
    setConfirmDelete(saleGroupId);
  }

  async function confirmDeletion() {
    try {
      const { error } = await supabase
        .from('sale_groups')
        .delete()
        .eq('id', confirmDelete)
        .eq('store_id', storeId);
      if (error) throw error;
      alert('Receipt deleted successfully');
      setSales((prev) => prev.filter((sale) => sale.id !== confirmDelete));
      if (sales.length - 1 <= (currentPage - 1) * itemsPerPage) {
        setCurrentPage(Math.max(1, currentPage - 1));
      }
    } catch (error) {
      alert('Failed to delete receipt.');
    } finally {
      setConfirmDelete(null);
    }
  }

  // Handle print
  const handlePrint = (saleGroupId) => {
    if (printLoading) return;
    setPrintLoading(true);
    setPrintSaleId(saleGroupId); // Set sale ID for printing
    loadReceiptData(saleGroupId, () => {
      setTimeout(() => {
        if (receiptRef.current && receiptData && receiptData.group.id === saleGroupId) {
          console.log('Printing receipt for sale ID:', saleGroupId);
          window.print();
        } else {
          console.error('Print failed: receiptRef or receiptData not ready');
          alert('Pls click on the print again');
        }
        setPrintLoading(false);
        setPrintSaleId(null); // Reset after printing
      }, 500); // Increased delay for DOM update
    });
  };



// Receipt content
const ReceiptContent = () => {
  if (!receiptData) {
    return <div style={{ textAlign: 'center', fontSize: '10pt' }}>Loading receipt...</div>;
  }
  return (
    <div
      className="printable-area"
      style={{
        width: '100%',
        maxWidth: '80mm',
        fontSize: '12pt',
        fontFamily: '"Courier New", Courier, monospace',
        padding: '5mm',
        margin: '0 auto',
        lineHeight: '1.3',
        background: '#fff',
        color: '#f80808ff',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ textAlign: 'center', margin: '0 0 3mm', fontSize: '14pt', fontWeight: 'extrabold' }}>
        {storeInfo.shop_name}
      </h3>
      <p style={{ textAlign: 'center', margin: '0 0 3mm', fontSize: '10pt' }}>{storeInfo.address}</p>
      <p style={{ textAlign: 'center', margin: '0 0 3mm', fontSize: '10pt' }}>
        Phone: {storeInfo.phone_number}
      </p>
      <p style={{ textAlign: 'center', margin: '0 0 6mm', fontWeight: 'bold', fontSize: '11pt' }}>
        Receipt #{receiptData.group.id}
      </p>
      <p style={{ margin: '0 0 3mm', fontSize: '10pt' }}>
        Date: {new Date(receiptData.group.created_at).toLocaleString()}
      </p>
      <p style={{ margin: '0 0 6mm', fontSize: '10pt' }}>
        Customer: {receiptData.customer?.fullname || ''}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 6mm', fontSize: '10pt' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '2mm 0', borderBottom: '1px solid #000' }}>Item</th>
            <th style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>Price</th>
            <th style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {receiptData.items.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: '2mm 0', borderBottom: '1px solid #000' }}>
                {item.dynamic_product.name}
              </td>
              <td style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>
                {item.quantity}
              </td>
              <td style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>
                {formatCurrency(item.unit_price)}
              </td>
              <td style={{ textAlign: 'right', padding: '2mm 0', borderBottom: '1px solid #000' }}>
                {formatCurrency(item.quantity * item.unit_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ textAlign: 'right', margin: '3mm 0', fontSize: '10pt' }}>
        Subtotal: {formatCurrency(receiptData.subtotal)}
      </p>
      <p style={{ textAlign: 'right', margin: '3mm 0', fontSize: '10pt' }}>
        VAT ({(vatRate * 100).toFixed(2)}%): {formatCurrency(receiptData.vatAmount)}
      </p>
      <p
        style={{
          textAlign: 'right',
          margin: '3mm 0',
          fontWeight: 'bold',
          fontSize: '11pt',
        }}
      >
        Total: {formatCurrency(receiptData.total)}
      </p>
      <p style={{ margin: '3mm 0', fontSize: '10pt' }}>
        Payment Method: {receiptData.group.payment_method}
      </p>
      <p style={{ textAlign: 'center', margin: '6mm 0 0', fontSize: '10pt' }}>
        Thank you!
      </p>
    </div>
  );
};

// Updated print styles
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area {
      position: static !important;
      width: 100%;
      max-width: 80mm;
      margin: 0 auto !important;
      padding: 5mm;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 12pt !important;
      line-height: 1.3 !important;
      background: #fff !important;
      color: #000 !important;
      text-align: center;
    }
    .printable-area table { page-break-inside: auto; width: 100%; margin: 0 auto; }
    .printable-area tr { page-break-inside: avoid; break-inside: avoid; }
    .printable-area th, .printable-area td { border-color: #000 !important; }
  }
  @media screen {
    .printable-area { display: none; }
  }
`;

// Updated receiptRef div
<div
  style={{
    display: printSaleId ? 'block' : 'none',
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: '80mm',
    maxWidth: '80mm',
    margin: '0 auto',
    background: '#fff',
    color: '#000',
  }}
  ref={receiptRef}
>
  {printSaleId && receiptData && receiptData.group.id === printSaleId ? <ReceiptContent /> : null}
</div>

  return (
    <div className="w-full p-6 sm:p-6 space-y-6 dark:bg-gray-900 dark:text-white">
      <style>{printStyles}</style>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Sales Receipts</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setIsListOpen(!isListOpen)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            {isListOpen ? 'Close Receipts' : 'Open Receipts'}
          </button>
         
        </div>
      </div>
      <div className="w-full">
        {isListOpen && (
          <div className="space-y-6">
            <div className="mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Sale Group ID"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
              />
            </div>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="w-full overflow-x-auto rounded-lg shadow">
                  <table className="w-full text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Receipt ID
                        </th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Date
                        </th>
                      
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Total
                        </th>
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 even:bg-gray-50 dark:even:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                            #{sale.id}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </td>
                        
                          <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-right">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-center flex gap-4 justify-center">
                            
                            <button
                              onClick={() => handlePrint(sale.id)}
                              disabled={printLoading}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                            >
                              {printLoading ? 'Loading...' : 'Print'}
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(sale.id)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {sales.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-gray-500 dark:text-gray-400 py-6"
                          >
                            No receipts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      {isPreviewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                Receipt Preview
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
            <div className="printable-area">
              <ReceiptContent />
            </div>
            <button
              onClick={() => handlePrint(receiptData?.group?.id)}
              disabled={printLoading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full text-sm sm:text-base"
            >
              {printLoading ? 'Loading...' : 'Print'}
            </button>
          </motion.div>
        </motion.div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
            <p className="mb-4 text-gray-800 dark:text-white">
              Are you sure you want to delete this receipt?
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDeletion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: printSaleId ? 'block' : 'none', position: 'absolute', top: 0, left: 0 }} ref={receiptRef}>
        {printSaleId && receiptData && receiptData.group.id === printSaleId ? <ReceiptContent /> : null}
      </div>
    </div>
  );
};

export default ReceiptModule;