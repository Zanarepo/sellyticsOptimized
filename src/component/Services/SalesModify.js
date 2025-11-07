
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Utility function for formatting currency
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

// Fetch VAT rate
const fetchVat = async (storeId) => {
  try {
    const { data, error } = await supabase
      .from('vat')
      .select('amount')
      .eq('store_id', storeId)
      .single();
    if (error) throw error;
    const vatRate = parseFloat(data?.amount) || 0;
    if (isNaN(vatRate)) {
      console.error('Invalid VAT rate received:', data?.amount);
      return 0;
    }
    return vatRate; // Returns percentage (e.g., 7.5 for 7.5%)
  } catch (error) {
    console.error('Failed to fetch VAT:', error.message);
    return 0;
  }
};

// Update sale_groups total_amount
const updateSaleGroupTotal = async (saleGroupId, storeId) => {
  try {
    // Fetch all sales for the sale group
    const { data: sales, error: salesError } = await supabase
      .from('dynamic_sales')
      .select('quantity, unit_price')
      .eq('sale_group_id', saleGroupId)
      .eq('store_id', storeId);

    if (salesError) throw salesError;

    // Fetch VAT rate
    const vatRate = await fetchVat(storeId);
    const decimalVatRate = vatRate / 100;

    // Calculate total amount for the sale group
    const totalAmount = sales.reduce((sum, sale) => {
      const subtotal = parseFloat(sale.unit_price) * parseInt(sale.quantity, 10);
      const vatAmount = subtotal * decimalVatRate;
      return sum + subtotal + vatAmount;
    }, 0);

    // Update sale_groups table
    const { error: updateError } = await supabase
      .from('sale_groups')
      .update({ total_amount: totalAmount })
      .eq('id', saleGroupId)
      .eq('store_id', storeId);

    if (updateError) throw updateError;

    return totalAmount;
  } catch (error) {
    console.error('Failed to update sale_groups total_amount:', error.message);
    throw error;
  }
};

const SalesEditModule = () => {
  const storeId = localStorage.getItem('store_id');
  const [isListOpen, setIsListOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({ email: '', admin_code: '' });
  const [editSale, setEditSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [authAction, setAuthAction] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Validate storeId
  useEffect(() => {
    if (!storeId) {
      toast.error('Please log in to continue.', { autoClose: 3000 });
      navigate('/login');
    }
  }, [storeId, navigate]);

  // Fetch VAT rate
  useEffect(() => {
    async function loadVat() {
      const vat = await fetchVat(storeId);
      setVatRate(vat);
      if (vat === 0) {
        toast.warn('VAT rate is not set or invalid. Using 0% VAT.', { autoClose: 3000 });
      }
    }
    if (storeId) {
      loadVat();
    }
  }, [storeId]);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!storeId) return;

      try {
        const { data, error } = await supabase
          .from('store_admins')
          .select('admin_id')
          .eq('store_id', storeId);

        if (error) throw error;
        setIsAdmin(data && data.length > 0);
      } catch (error) {
        toast.error(`Failed to check admin status: ${error.message}`, { autoClose: 3000 });
        setIsAdmin(false);
      }
    }
    if (storeId) {
      checkAdmin();
    }
  }, [storeId]);

  // Fetch products for dropdown
  useEffect(() => {
    async function fetchProducts() {
      if (!storeId) return;
      try {
        const { data, error } = await supabase
          .from('dynamic_product')
          .select('id, name')
          .eq('store_id', storeId);
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        toast.error(`Failed to fetch products: ${error.message}`, { autoClose: 3000 });
      }
    }
    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  // Fetch sales list
  useEffect(() => {
    const fetchSalesList = async () => {
      if (!storeId) return;

      try {
        let query = supabase
          .from('dynamic_sales')
          .select('*, dynamic_product(name)', { count: 'exact' })
          .eq('store_id', storeId)
          .order('sold_at', { ascending: false });

        if (search) {
          const searchId = parseInt(search, 10);
          if (!isNaN(searchId)) {
            query = query.eq('id', searchId);
          }
        } else {
          query = query.range(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage - 1
          );
        }

        const { data, count, error } = await query;
        if (error) throw error;

        setSales(data || []);
        setTotalPages(search ? 1 : Math.ceil((count || 0) / itemsPerPage));
        if (search && data.length > 0) {
          setCurrentPage(1);
        }
      } catch (error) {
        toast.error(`Failed to fetch sales list: ${error.message}`, { autoClose: 3000 });
        setSales([]);
        setTotalPages(1);
      }
    };

    const debouncedFetch = debounce(fetchSalesList, 300);
    if (storeId) {
      debouncedFetch();
    }
  }, [currentPage, search, storeId]);

  // Real-time subscription for dynamic_sales
  useEffect(() => {
    if (!storeId) return;

    const subscription = supabase
      .channel('dynamic_sales_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dynamic_sales', filter: `store_id=eq.${storeId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setSales((prev) => prev.filter((sale) => sale.id !== payload.old.id));
            // Update sale_groups total_amount after deletion
            if (payload.old.sale_group_id) {
              await updateSaleGroupTotal(payload.old.sale_group_id, storeId);
            }
          } else if (payload.eventType === 'UPDATE') {
            setSales((prev) =>
              prev.map((sale) =>
                sale.id === payload.new.id ? { ...sale, ...payload.new } : sale
              )
            );
            // Update sale_groups total_amount after update
            if (payload.new.sale_group_id) {
              await updateSaleGroupTotal(payload.new.sale_group_id, storeId);
            }
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

  // Handle admin authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('store_admins')
        .select('admin_id')
        .eq('store_id', storeId)
        .eq('email', authCredentials.email)
        .eq('admin_code', authCredentials.admin_code);

      if (error) throw error;

      if (data && data.length > 0) {
        setIsAuthModalOpen(false);
        setAuthCredentials({ email: '', admin_code: '' });
        setError('');
        if (authAction === 'edit') {
          setIsEditModalOpen(true);
        } else if (authAction === 'delete') {
          await confirmDeletion();
        }
      } else {
        setError('Invalid admin email or code');
      }
    } catch (error) {
      setError(`Authentication failed: ${error.message}`);
    }
  };

  // Handle sale edit
  const handleEditSale = (sale) => {
    setEditSale({
      id: sale.id,
      dynamic_product_id: sale.dynamic_product_id,
      quantity: sale.quantity,
      unit_price: sale.unit_price,
      payment_method: sale.payment_method,
      device_id: sale.device_id || '',
      customer_name: sale.customer_name || '',
      device_size: sale.device_size || '',
      dynamic_product_imeis: sale.dynamic_product_imeis || '',
      status: sale.status || 'sold',
      sale_group_id: sale.sale_group_id || null,
    });
    setAuthAction('edit');
    setIsAuthModalOpen(true);
  };

  // Handle sale update
  const handleUpdateSale = async (e) => {
    e.preventDefault();
    if (!editSale) return;

    try {
      const subtotal = parseFloat(editSale.unit_price) * parseInt(editSale.quantity, 10);
      const vatAmount = subtotal * (vatRate / 100);
      const totalAmount = subtotal + vatAmount;

      const updatedSale = {
        dynamic_product_id: parseInt(editSale.dynamic_product_id, 10),
        quantity: parseInt(editSale.quantity, 10),
        unit_price: parseFloat(editSale.unit_price),
        amount: totalAmount,
        payment_method: editSale.payment_method,
        device_id: editSale.device_id || null,
        customer_name: editSale.customer_name || null,
        device_size: editSale.device_size || null,
        dynamic_product_imeis: editSale.dynamic_product_imeis || null,
        status: editSale.status,
        updated_at: new Date().toISOString(),
        sale_group_id: editSale.sale_group_id,
      };

      const { data, error } = await supabase
        .from('dynamic_sales')
        .update(updatedSale)
        .eq('id', editSale.id)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) throw error;

      // Update sale_groups total_amount
      if (editSale.sale_group_id) {
        await updateSaleGroupTotal(editSale.sale_group_id, storeId);
      }

      // Update local state
      setSales((prev) =>
        prev.map((sale) => (sale.id === data.id ? { ...sale, ...data } : sale))
      );

      toast.success('Sale updated successfully', { autoClose: 3000 });
      setIsEditModalOpen(false);
      setEditSale(null);
    } catch (error) {
      toast.error(`Failed to update sale: ${error.message}`, { autoClose: 3000 });
    }
  };

  // Handle sale deletion
  const handleDeleteSale = async (saleId) => {
    const sale = sales.find((s) => s.id === saleId);
    setEditSale({ id: saleId, sale_group_id: sale?.sale_group_id || null });
    setAuthAction('delete');
    setIsAuthModalOpen(true);
  };

const confirmDeletion = async () => {
  try {
    // Fetch the sale details to get dynamic_product_id, quantity, and sale_group_id
    const { data: saleData, error: fetchError } = await supabase
      .from('dynamic_sales')
      .select('dynamic_product_id, quantity, sale_group_id')
      .eq('id', editSale.id)
      .eq('store_id', storeId)
      .single();
    if (fetchError) throw new Error(`Failed to fetch sale: ${fetchError.message}`);

    // Delete the sale
    const { error: deleteError } = await supabase
      .from('dynamic_sales')
      .delete()
      .eq('id', editSale.id)
      .eq('store_id', storeId);
    if (deleteError) throw new Error(`Failed to delete sale: ${deleteError.message}`);

    // Update inventory by incrementing product quantity in dynamic_inventory
    if (saleData?.dynamic_product_id && saleData?.quantity) {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('dynamic_inventory')
        .select('available_qty')
        .eq('dynamic_product_id', saleData.dynamic_product_id)
        .eq('store_id', storeId)
        .single();
      if (inventoryError) throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);

      const newQuantity = (inventoryData.available_qty || 0) + saleData.quantity;

      const { error: updateError } = await supabase
        .from('dynamic_inventory')
        .update({ available_qty: newQuantity })
        .eq('dynamic_product_id', saleData.dynamic_product_id)
        .eq('store_id', storeId);
      if (updateError) throw new Error(`Failed to update inventory: ${updateError.message}`);
    }

    // Update sale_groups total_amount
    if (saleData?.sale_group_id) {
      await updateSaleGroupTotal(saleData.sale_group_id, storeId);
    }

    toast.success('Sale deleted successfully', { autoClose: 3000 });
    setEditSale(null);
    if (sales.length - 1 <= (currentPage - 1) * itemsPerPage && !search) {
      setCurrentPage(Math.max(1, currentPage - 1));
    }
  } catch (error) {
    toast.error(`Failed to delete sale: ${error.message}`, { autoClose: 3000 });
  } finally {
    setIsAuthModalOpen(false);
    setAuthAction('');
  }
};

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 dark:bg-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Manage Sales</h2>
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
        >
          {isListOpen ? 'Close Sales' : 'Open Sales'}
        </button>
      </div>
      <div className="w-full">
        {isListOpen && (
          <div className="space-y-6">
            <div className="mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Sale ID"
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
                          Sale ID
                        </th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Date
                        </th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Product
                        </th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Quantity
                        </th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Amount
                        </th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          VAT ({vatRate.toFixed(1)}%)
                        </th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Total
                        </th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Customer
                        </th>
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => {
                        const subtotal = sale.quantity * sale.unit_price;
                        const vatAmount = subtotal * (vatRate / 100);
                        const totalAmount = subtotal + vatAmount;
                        return (
                          <tr
                            key={sale.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 even:bg-gray-50 dark:even:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                              #{sale.id}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                              {new Date(sale.sold_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                              {sale.dynamic_product.name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-right">
                              {sale.quantity}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-right">
                              {formatCurrency(subtotal)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-right">
                              {formatCurrency(vatAmount)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-right">
                              {formatCurrency(totalAmount)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                              {sale.customer_name || 'Cash Customer'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 text-center flex gap-2 sm:gap-4 justify-center">
                              <button
                                onClick={() => handleEditSale(sale)}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {sales.length === 0 && (
                        <tr>
                          <td
                            colSpan="9"
                            className="text-center text-gray-500 dark:text-gray-400 py-6"
                          >
                            No sales found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && !search && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-between mt-4 gap-2 sm:gap-4">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm"
                    >
                      Previous
                    </button>
                    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
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
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm"
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
      {isAuthModalOpen && (
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-4 sm:p-6"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
              Admin Authentication
            </h3>
            {error && (
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            )}
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authCredentials.email}
                  onChange={(e) => setAuthCredentials({ ...authCredentials, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Admin Code
                </label>
                <input
                  type="password"
                  value={authCredentials.admin_code}
                  onChange={(e) => setAuthCredentials({ ...authCredentials, admin_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  maxLength="6"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleAuthSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Authenticate
                </button>
                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setAuthCredentials({ email: '', admin_code: '' });
                    setError('');
                    setAuthAction('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {isEditModalOpen && editSale && (
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
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
              Edit Sale #{editSale.id}
            </h3>
            <form onSubmit={handleUpdateSale}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Product
                </label>
                <select
                  value={editSale.dynamic_product_id}
                  onChange={(e) => setEditSale({ ...editSale, dynamic_product_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={editSale.quantity}
                  onChange={(e) => setEditSale({ ...editSale, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  min="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editSale.unit_price}
                  onChange={(e) => setEditSale({ ...editSale, unit_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  VAT ({vatRate.toFixed(1)}%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(
                    parseFloat(editSale.unit_price || 0) * parseInt(editSale.quantity || 0, 10) * (vatRate / 100)
                  ).toFixed(2)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(
                    parseFloat(editSale.unit_price || 0) * parseInt(editSale.quantity || 0, 10) +
                    parseFloat(editSale.unit_price || 0) * parseInt(editSale.quantity || 0, 10) * (vatRate / 100)
                  ).toFixed(2)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Payment Method
                </label>
                <select
                  value={editSale.payment_method}
                  onChange={(e) => setEditSale({ ...editSale, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={editSale.customer_name}
                  onChange={(e) => setEditSale({ ...editSale, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Device ID
                </label>
                <input
                  type="text"
                  value={editSale.device_id}
                  onChange={(e) => setEditSale({ ...editSale, device_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Device Size
                </label>
                <input
                  type="text"
                  value={editSale.device_size}
                  onChange={(e) => setEditSale({ ...editSale, device_size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  IMEI(s)
                </label>
                <input
                  type="text"
                  value={editSale.dynamic_product_imeis}
                  onChange={(e) => setEditSale({ ...editSale, dynamic_product_imeis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
                  Status
                </label>
                <select
                  value={editSale.status}
                  onChange={(e) => setEditSale({ ...editSale, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Update Sale
                </button>
                <button
                  type="button"
                  onClick={confirmDeletion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Delete Sale
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditSale(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SalesEditModule;
