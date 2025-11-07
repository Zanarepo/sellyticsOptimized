
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Debug: Log imports
console.log('React:', React);
console.log('supabase:', supabase);
console.log('ReactToPrint:', ReactToPrint);

// Utility function
const formatCurrency = (value) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ReceiptModule = () => {
  const storeId = localStorage.getItem('store_id');
  const userId = localStorage.getItem('user_id');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [vatRate, setVatRate] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const receiptRef = useRef(null);
  const navigate = useNavigate();

  // Debug: Log receiptRef
  useEffect(() => {
    console.log('receiptRef.current:', receiptRef.current);
  }, [receiptData]);

  // Validate storeId and userId
  useEffect(() => {
    if (!storeId || !userId) {
      toast.error('Please log in to continue.', { autoClose: 3000 });
      navigate('/login');
    }
  }, [storeId, userId, navigate]);

  // Fetch VAT and store name
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
        const vat = parseFloat(vatData?.amount) || 0;
        setVatRate(vat);
        if (vat === 0) {
          toast.warn('VAT rate is not set or invalid. Using 0% VAT.', { autoClose: 3000 });
        }

        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single();
        if (storeError) {
          throw new Error(`Failed to fetch store name: ${storeError.message}`);
        }
        setStoreName(storeData?.name || 'Store');
      } catch (error) {
        toast.error(error.message, { autoClose: 3000 });
        setVatRate(0);
        setStoreName('Store');
      }
    }
    fetchVatAndStore();
  }, [storeId]);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!storeId || !userId) return;

      try {
        const { data, error } = await supabase
          .from('store_admins')
          .select('id')
          .eq('store_id', storeId)
          .eq('user_id', userId);
        if (error) {
          throw new Error(`Failed to check admin status: ${error.message}`);
        }
        setIsAdmin(data && data.length > 0);
      } catch (error) {
        toast.error(error.message, { autoClose: 3000 });
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [storeId, userId]);

  // Fetch receipts list
  const perPage = 10;
  useEffect(() => {
    async function fetchSalesList() {
      if (!storeId) return;

      try {
        let query = supabase
          .from('sale_groups')
          .select('*', { count: 'exact' })
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        if (search) {
          query = query.ilike('customer_name', `%${search}%`);
        }

        const { data, count, error } = await query.range((page - 1) * perPage, page * perPage - 1);
        if (error) {
          throw new Error(`Failed to fetch receipts list: ${error.message}`);
        }

        setSales(data || []);
        setTotalPages(Math.ceil((count || 0) / perPage));
      } catch (error) {
        toast.error(`Failed to fetch receipts list: ${error.message}`, { autoClose: 3000 });
        setSales([]);
        setTotalPages(1);
      }
    }
    fetchSalesList();
  }, [page, search, storeId]);

  // Load receipt data
  async function loadReceiptData(saleGroupId, callback) {
    if (!storeId) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('sale_groups')
        .select('*')
        .eq('id', saleGroupId)
        .eq('store_id', storeId)
        .single();
      if (groupError) {
        throw new Error(`Failed to fetch sale group: ${groupError.message}`);
      }

      const { data: items, error: itemsError } = await supabase
        .from('dynamic_sales')
        .select('*, dynamic_product(name)')
        .eq('sale_group_id', saleGroupId)
        .eq('store_id', storeId);
      if (itemsError) {
        throw new Error(`Failed to fetch sale items: ${itemsError.message}`);
      }

      const customerId = group.customer_id;
      let customer = null;
      if (customerId) {
        const { data, error } = await supabase
          .from('customer')
          .select('fullname, address, phone_number')
          .eq('id', customerId)
          .single();
        if (error && error.code !== 'PGRST116') {
          throw new Error(`Failed to fetch customer: ${error.message}`);
        }
        customer = data;
      }

      // Calculate subtotal (pre-VAT), VAT amount, and total
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;

      // Verify total matches group.total_amount
      if (Math.abs(total - group.total_amount) > 0.01) {
        console.warn(
          `Total mismatch for sale group ${saleGroupId}: calculated=${total.toFixed(2)}, stored=${group.total_amount.toFixed(2)}`
        );
        // Optionally update sale_groups to fix inconsistency
        await supabase
          .from('sale_groups')
          .update({ total_amount: total })
          .eq('id', saleGroupId)
          .eq('store_id', storeId);
      }

      setReceiptData({ group, items, customer, subtotal, vatAmount, total });
      console.log('Receipt data loaded for sale:', saleGroupId);
      if (callback) callback();
    } catch (error) {
      toast.error(`Failed to load receipt data: ${error.message}`, { autoClose: 3000 });
      setReceiptData(null);
    }
  }

  // Delete receipt (admin only)
  async function handleDelete(saleGroupId) {
    if (!isAdmin) {
      toast.error('Only admins can delete receipts', { autoClose: 3000 });
      return;
    }
    try {
      const { error } = await supabase.from('sale_groups').delete().eq('id', saleGroupId).eq('store_id', storeId);
      if (error) {
        throw new Error(`Failed to delete receipt: ${error.message}`);
      }
      toast.success('Receipt deleted successfully', { autoClose: 3000 });
      setPage(1);
    } catch (error) {
      toast.error(error.message, { autoClose: 3000 });
    }
  }

  // Receipt content
  const ReceiptContent = () => {
    if (!receiptData) return <div>Loading receipt...</div>;
    return (
      <div style={{ width: '80mm', fontSize: '12pt', fontFamily: 'monospace', padding: '0', margin: '0' }}>
        <h3 style={{ textAlign: 'center', margin: '0' }}>{storeName}</h3>
        <p style={{ textAlign: 'center', margin: '0' }}>Receipt</p>
        <p style={{ margin: '0' }}>Date: {new Date(receiptData.group.created_at).toLocaleString()}</p>
        <p style={{ margin: '0' }}>Customer: {receiptData.customer?.fullname || 'Cash Customer'}</p>
        <p style={{ margin: '0' }}>Phone: {receiptData.customer?.phone_number || 'N/A'}</p>
        <p style={{ margin: '0' }}>Address: {receiptData.customer?.address || 'N/A'}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5mm' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item) => (
              <tr key={item.id}>
                <td>{item.dynamic_product.name} {item.device_id ? `(${item.device_id})` : ''}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign: 'right', margin: '0' }}>Subtotal: {formatCurrency(receiptData.subtotal)}</p>
        <p style={{ textAlign: 'right', margin: '0' }}>VAT ({vatRate.toFixed(2)}%): {formatCurrency(receiptData.vatAmount)}</p>
        <p style={{ textAlign: 'right', margin: '0' }}>Total: {formatCurrency(receiptData.total)}</p>
        <p style={{ margin: '0' }}>Payment Method: {receiptData.group.payment_method}</p>
        <p style={{ textAlign: 'center', marginTop: '5mm' }}>Thank you!</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Receipts</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsListOpen(!isListOpen)}
            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {isListOpen ? 'Close Receipts' : 'Open Receipts'}
          </button>
          {ReactToPrint ? (
            <ReactToPrint
              trigger={() => (
                <button className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print Latest</button>
              )}
              content={() => {
                console.log('Print Latest - receiptRef:', receiptRef.current);
                return receiptRef.current;
              }}
              pageStyle="@page { size: 80mm auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; } }"
              onBeforeGetContent={() => {
                console.log('Print Latest - Loading data');
                return new Promise((resolve) => {
                  if (sales.length === 0) {
                    toast.error('No receipts available to print', { autoClose: 3000 });
                    resolve();
                    return;
                  }
                  loadReceiptData(sales[0].id, resolve);
                });
              }}
            />
          ) : (
            <button
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => toast.error('Print failed: react-to-print unavailable', { autoClose: 3000 })}
            >
              Print Latest
            </button>
          )}
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg max-w-md w-full">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="mb-2 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
            <div ref={receiptRef}>
              <ReceiptContent />
            </div>
            {ReactToPrint ? (
              <ReactToPrint
                trigger={() => (
                  <button className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print</button>
                )}
                content={() => {
                  console.log('Modal Print - receiptRef:', receiptRef.current);
                  return receiptRef.current;
                }}
                pageStyle="@page { size: 80mm auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; } }"
              />
            ) : (
              <button
                className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => toast.error('Print failed: react-to-print unavailable', { autoClose: 3000 })}
              >
                Print
              </button>
            )}
          </div>
        </div>
      )}

      {isListOpen && (
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name"
            className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white mb-4"
          />
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-right">Total</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="border p-2">{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{sale.customer_name || 'Cash Customer'}</td>
                  <td className="border p-2 text-right">{formatCurrency(sale.total_amount)}</td>
                  <td className="border p-2 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        console.log('View Details - Loading sale:', sale.id);
                        loadReceiptData(sale.id, () => setIsPreviewOpen(true));
                      }}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    {ReactToPrint ? (
                      <ReactToPrint
                        trigger={() => (
                          <button className="p-1 bg-green-600 text-white rounded hover:bg-blue-700">Print</button>
                        )}
                        content={() => {
                          console.log('Row Print - receiptRef:', receiptRef.current);
                          return receiptRef.current;
                        }}
                        pageStyle="@page { size: 80mm auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; } }"
                        onBeforeGetContent={() => {
                          console.log('Row Print - Loading sale:', sale.id);
                          return new Promise((resolve) => {
                            loadReceiptData(sale.id, resolve);
                          });
                        }}
                      />
                    ) : (
                      <button
                        className="p-1 bg-green-600 text-white rounded hover:bg-blue-700"
                        onClick={() => toast.error('Print failed: react-to-print unavailable', { autoClose: 3000 })}
                      >
                        Print
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="4" className="border p-2 text-center text-gray-500 dark:text-gray-400">
                    No receipts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 border rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
            >
              Prev
            </button>
            <span className="p-2">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 border rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptModule;
