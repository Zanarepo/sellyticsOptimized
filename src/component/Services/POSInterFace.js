
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCamera, FaSearch, FaTrashAlt, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import CustomerSelector from '../DynamicSales/CustomerSelector';
import { fetchProducts } from '../Services/productModule';
import { checkInventory } from '../Services/inventoryModule';
import { fetchSales, processSale } from '../Services/salesModule';
import { fetchVat } from '../Services/vatModule';
import { validateDeviceId } from '../Services/scannerModule';
import ReceiptModule from '../Services/ReceiptModules';
import ReceiptModules2 from '../Services/ReceiptModules2';
import { motion } from 'framer-motion';
import SalesModify from '../Services/SalesModify';

// Utility function
const formatCurrency = (value) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function POSInterface() {
  const storeId = localStorage.getItem('store_id');
  const userId = localStorage.getItem('user_id');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [externalScannerMode, setExternalScannerMode] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vatRate, setVatRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef(null);
  const [printHandler, setPrintHandler] = useState(null);

  // Debug printHandler
  useEffect(() => {
    console.log('printHandler:', printHandler ? 'Set' : 'Not set');
  }, [printHandler]);

  const loadInitialData = useCallback(async () => {
    if (!storeId) {
      console.error('Store ID is missing');
      toast.error('Store ID is missing. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const fetchedProducts = await fetchProducts(storeId);
      console.log('Fetched products:', fetchedProducts);
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      const sales = await fetchSales(storeId);
      console.log('Fetched sales:', sales);
      setSales(Array.isArray(sales) ? sales : []);
      const vat = await fetchVat(storeId);
      setVatRate(vat || 0);
    } catch (error) {
      console.error('Failed to load initial data:', error.message);
      setProducts([]);
      setSales([]);
      setVatRate(0);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // External scanner
  useEffect(() => {
    if (!externalScannerMode || isLoading) return;

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeypress = async (e) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50 && buffer) {
        buffer = '';
      }

      if (e.key === 'Enter' && buffer) {
        const scannedDeviceId = buffer.trim();
        if (!Array.isArray(products) || products.length === 0) {
          setScannerError('Product data is not available. Please wait for data to load.');
          toast.error('Product data is not available. Please wait for data to load.');
          buffer = '';
          return;
        }

        const result = await validateDeviceId(scannedDeviceId, products);
        if (result.error) {
          setScannerError(result.error);
          toast.error(result.error);
          buffer = '';
          return;
        }

        const { product } = result;
        const canAdd = await checkInventory(product.id, 1, storeId, products);
        if (!canAdd) {
          buffer = '';
          return;
        }

        setCart((prev) => {
          const existingItem = prev.find((item) => item.dynamic_product_id === product.id);
          if (existingItem) {
            if (existingItem.deviceIds.includes(scannedDeviceId)) {
              toast.error(`Product ID "${scannedDeviceId}" already in cart`);
              return prev;
            }
            return prev.map((item) =>
              item.dynamic_product_id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    deviceIds: [...item.deviceIds, scannedDeviceId],
                    deviceSizes: [...item.deviceSizes, product.deviceSize || ''],
                  }
                : item
            );
          }
          return [
            ...prev,
            {
              dynamic_product_id: product.id,
              quantity: 1,
              unit_price: product.selling_price,
              deviceIds: [scannedDeviceId],
              deviceSizes: [product.deviceSize || ''],
            },
          ];
        });
        toast.success(`Added ${product.name}`);
        setScannerError(null);
        buffer = '';
      } else if (e.key !== 'Enter') {
        buffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    document.addEventListener('keypress', handleKeypress);
    return () => document.removeEventListener('keypress', handleKeypress);
  }, [externalScannerMode, isLoading, storeId, products]);

  // Webcam scanner
  useEffect(() => {
    if (!scannerActive || externalScannerMode) return;

    setScannerLoading(true);
    scannerRef.current = new Html5Qrcode('scanner');

    const config = {
      fps: 60,
      qrbox: { width: 250, height: 125 },
      formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.QR_CODE],
      aspectRatio: 1.0,
    };

    const onScanSuccess = async (scannedDeviceId) => {
      const currentTime = Date.now();
      if (currentTime - lastScanTimeRef.current < 500 || lastScannedCodeRef.current === scannedDeviceId) {
        return;
      }
      lastScanTimeRef.current = currentTime;
      lastScannedCodeRef.current = scannedDeviceId;

      if (!Array.isArray(products)) {
        setScannerError('Product data is not available');
        toast.error('Product data is not available');
        return;
      }
      const result = await validateDeviceId(scannedDeviceId, storeId, products);
      if (result.error) {
        setScannerError(result.error);
        toast.error(result.error);
        return;
      }

      const { product } = result;
      const canAdd = await checkInventory(product.id, 1, storeId, products);
      if (!canAdd) return;

      setCart((prev) => {
        const existingItem = prev.find((item) => item.dynamic_product_id === product.id);
        if (existingItem) {
          if (existingItem.deviceIds.includes(scannedDeviceId)) {
            toast.error(`Product ID "${scannedDeviceId}" already in cart`);
            return prev;
          }
          return prev.map((item) =>
            item.dynamic_product_id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  deviceIds: [...item.deviceIds, scannedDeviceId],
                  deviceSizes: [...item.deviceSizes, product.deviceSize || ''],
                }
              : item
          );
        }
        return [
          ...prev,
          {
            dynamic_product_id: product.id,
            quantity: 1,
            unit_price: product.selling_price,
            deviceIds: [scannedDeviceId],
            deviceSizes: [product.deviceSize || ''],
          },
        ];
      });
      toast.success(`Added ${product.name}`);
      setScannerError(null);
    };

    const onScanFailure = (error) => {
      if (!error.includes('No MultiFormat Readers') && !error.includes('No QR code')) {
        setScannerError(`Scan error: ${error}`);
      }
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras.length === 0) {
          setScannerError('No cameras detected');
          setScannerLoading(false);
          toast.error('No cameras detected');
          return;
        }
        scannerRef.current
          .start({ facingMode: 'environment' }, config, onScanSuccess, onScanFailure)
          .then(() => setScannerLoading(false));
      })
      .catch((err) => {
        setScannerError(`Camera access error: ${err.message}`);
        setScannerLoading(false);
        toast.error('Camera access error');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error('Error stopping scanner:', err));
        scannerRef.current = null;
      }
    };
  }, [scannerActive, externalScannerMode, storeId, products]);

  // Add product to cart
  const addToCart = useCallback(
    async (productId, deviceId = '') => {
      if (!Array.isArray(products)) {
        toast.error('Product data is not available');
        return;
      }
      const product = products.find((p) => p.id === productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      const canAdd = await checkInventory(productId, 1, storeId, products);
      if (!canAdd) return;

      setCart((prev) => {
        const existingItem = prev.find((item) => item.dynamic_product_id === productId);
        if (existingItem) {
          if (deviceId && existingItem.deviceIds.includes(deviceId)) {
            toast.error(`Product ID "${deviceId}" already in cart`);
            return prev;
          }
          return prev.map((item) =>
            item.dynamic_product_id === productId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  deviceIds: deviceId ? [...item.deviceIds, deviceId] : item.deviceIds,
                  deviceSizes: deviceId
                    ? [
                        ...item.deviceSizes,
                        product.deviceSizes?.[product.deviceIds?.indexOf(deviceId)] || '',
                      ]
                    : item.deviceSizes,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            dynamic_product_id: productId,
            quantity: 1,
            unit_price: product.selling_price,
            deviceIds: deviceId ? [deviceId] : [],
            deviceSizes: deviceId
              ? [product.deviceSizes?.[product.deviceIds?.indexOf(deviceId)] || '']
              : [],
          },
        ];
      });
      toast.success(`Added ${product.name}`);
      setSearchQuery('');
    },
    [products, storeId]
  );

  // Manual input handler
  const handleManualInput = useCallback(async () => {
    const trimmedInput = manualInput.trim();
    if (!trimmedInput) {
      toast.error('Product ID cannot be empty');
      setScannerError('Product ID cannot be empty');
      return;
    }

    if (!Array.isArray(products)) {
      toast.error('Product data is not available');
      setScannerError('Product data is not available');
      setManualInput('');
      return;
    }

    const result = await validateDeviceId(trimmedInput, storeId, products);
    if (result.error) {
      setScannerError(result.error);
      toast.error(result.error);
      setManualInput('');
      return;
    }

    const { product } = result;
    const canAdd = await checkInventory(product.id, 1, storeId, products);
    if (!canAdd) {
      setManualInput('');
      return;
    }

    addToCart(product.id, trimmedInput);
    setManualInput('');
    setScannerError(null);
  }, [manualInput, storeId, products, addToCart]);

  // Update cart quantity
  const updateQuantity = useCallback(
    async (index, quantity) => {
      const newQuantity = Math.max(1, parseInt(quantity) || 1);
      const cartItem = cart[index];
      const quantityDiff = newQuantity - cartItem.quantity;

      if (quantityDiff > 0) {
        const canAdd = await checkInventory(cartItem.dynamic_product_id, quantityDiff, storeId, products);
        if (!canAdd) return;
      }

      setCart((prev) => {
        const newCart = [...prev];
        newCart[index].quantity = newQuantity;
        return newCart;
      });
    },
    [cart, storeId, products]
  );

  // Remove item from cart
  const removeItem = useCallback((index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle process sales
  const handleProcessSale = useCallback(async () => {
    const success = await processSale(cart, storeId, userId, selectedCustomerId, paymentMethod, vatRate, products, (updatedSales, newSaleGroupId) => {
      setSales(Array.isArray(updatedSales) ? updatedSales : []);
      if (newSaleGroupId && printHandler) {
        console.log('Processing sale, printing receipt for ID:', newSaleGroupId);
        printHandler(newSaleGroupId);
      }
    });
    if (success) {
      setCart([]);
      setSelectedCustomerId(null);
      setPaymentMethod('Cash');
      toast.success('Sale processed successfully');
    }
  }, [cart, storeId, userId, selectedCustomerId, paymentMethod, vatRate, products, printHandler]);

  // Search products
  const filteredProducts = searchQuery
    ? Array.isArray(products)
      ? products.filter(
          (p) =>
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (Array.isArray(p.deviceIds) &&
              p.deviceIds.some((id) => id.toLowerCase().includes(searchQuery.toLowerCase())))
        )
      : []
    : [];

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

return (
  <div className="w-full h-screen p-4 sm:p-6 bg-white dark:from-gray-900 dark:to-gray-800 dark:text-white overflow-auto">
    <SalesModify />
    <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8 tracking-tight">
        Point of Sale
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add Items Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Add Items</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or ID..."
                className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                aria-label="Search products"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={() => setScannerActive(true)}
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Open scanner"
            >
              <FaCamera />
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={externalScannerMode}
                onChange={() => setExternalScannerMode((prev) => !prev)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700"
                aria-label="Toggle external scanner mode"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">External Scanner</span>
            </label>
          </div>
          {searchQuery && (
            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-inner">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  className="w-full p-4 text-left hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 flex justify-between items-center"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {product.id}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(product.selling_price)}
                  </span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No products found</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Cart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Cart</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cart.map((item, index) => {
              const product = Array.isArray(products) ? products.find((p) => p.id === item.dynamic_product_id) : null;
              return (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {product?.name || 'Unknown Product'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.deviceIds.join(', ') || 'No IDs'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                      <button
                        onClick={() => updateQuantity(index, Number(item.quantity) - 1)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        className="w-12 p-1 text-center border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                        min="1"
                        aria-label="Quantity"
                      />
                      <button
                        onClick={() => updateQuantity(index, Number(item.quantity) + 1)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm"
                      aria-label="Remove item"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              );
            })}
            {cart.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Cart is empty</p>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                aria-label="Select payment method"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>
            <CustomerSelector
              storeId={storeId}
              selectedCustomerId={selectedCustomerId}
              onCustomerChange={setSelectedCustomerId}
            />
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-900 dark:text-white">
                Subtotal: {formatCurrency(subtotal)}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                VAT ({(vatRate * 100).toFixed(2)}%): {formatCurrency(vatAmount)}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total: {formatCurrency(total)}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={handleProcessSale}
                className="flex-1 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="Process sale"
              >
                Process Sale
              </button>
            
            </div>
              <ReceiptModule
                onPrint={(saleGroupId, handlePrintFn) => {
                  console.log('Setting printHandler for sale ID:', saleGroupId);
                  setPrintHandler(() => handlePrintFn);
                }}
              />
          </div>
        </motion.div>
      </div>
<ReceiptModules2/>
      {/* Recent Sales Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mt-6"
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Recent Sales</h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                  Sale ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                  Items
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                  Total
                </th>
               
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sales) &&
                sales.map((sale) => {
                  const totalAmount = sale.items.reduce(
                    (sum, item) => sum + item.quantity * item.unit_price * (1 + vatRate),
                    0
                  );
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        #{sale.id}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        {sale.items.map((item) => {
                          const product = Array.isArray(products) ? products.find((p) => p.id === item.dynamic_product_id) : null;
                          return (
                            <div key={item.dynamic_product_id} className="text-sm">
                              {product?.name || 'Unknown Product'} x {item.quantity} -{' '}
                              {formatCurrency(item.quantity * item.unit_price)}
                              {item.customer_name && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Customer: {item.customer_name}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right">
                        {formatCurrency(totalAmount)}
                      </td>
                   
                    </tr>
                  );
                })}
              {(!Array.isArray(sales) || sales.length === 0) && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center text-gray-500 dark:text-gray-400 py-4"
                  >
                    No sales recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Scanner Modal */}
      {scannerActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Scan Product ID
              </h2>
              <button
                onClick={() => {
                  setScannerActive(false);
                  setScannerError(null);
                  setScannerLoading(false);
                  setManualInput('');
                }}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-200"
                aria-label="Close scanner"
              >
                <FaTimes />
              </button>
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={externalScannerMode}
                onChange={() => setExternalScannerMode((prev) => !prev)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700"
                aria-label="Toggle external scanner mode"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Use External Scanner</span>
            </label>
            {!externalScannerMode && (
              <>
                {scannerLoading && (
                  <div className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Initializing scanner...
                  </div>
                )}
                {scannerError && (
                  <div className="text-red-600 dark:text-red-400 mb-4 text-sm">
                    {scannerError}
                  </div>
                )}
                <div id="scanner" className="relative w-full h-64 mb-4 rounded-lg overflow-hidden shadow-inner">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-32 border-2 border-indigo-500 bg-transparent opacity-50 rounded-lg"></div>
                  </div>
                </div>
              </>
            )}
            {externalScannerMode && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full">
                  External scanner active
                </span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter Product ID Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter Product ID"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                  aria-label="Manual product ID input"
                />
                <button
                  onClick={handleManualInput}
                  className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md"
                  aria-label="Add product manually"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  </div>
);
}