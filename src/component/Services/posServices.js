import React, { useState, useEffect, useCallback, useRef } from 'react';
import {FaCamera, FaSearch, FaTrashAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import CustomerSelector from '../DynamicSales/CustomerSelector';
import { fetchProducts } from '../Services/productModule';
import { checkInventory } from '../Services/inventoryModule';
import { fetchSales, processSale } from '../Services/salesModule';
import { fetchVat } from '../Services//vatModule';
import { validateDeviceId } from '../Services/scannerModule';
import ReceiptModule from '../Services/ReceiptModules';


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
  const [externalScannerMode, setExternalScannerMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vatRate, setVatRate] = useState(0);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef(null);

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    const products = await fetchProducts(storeId);
    setProducts(products);
    const sales = await fetchSales(storeId);
    setSales(sales);
    const vat = await fetchVat(storeId);
    setVatRate(vat);
  }, [storeId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // External scanner
  useEffect(() => {
    if (!externalScannerMode) return;

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeypress = async (e) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50 && buffer) {
        buffer = '';
      }

      if (e.key === 'Enter' && buffer) {
        const scannedDeviceId = buffer.trim();
        const result = await validateDeviceId(scannedDeviceId, storeId, products);
        if (result.error) {
          setScannerError(result.error);
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
                    deviceSizes: [...item.deviceSizes, product.deviceSize],
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
              deviceSizes: [product.deviceSize],
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
  }, [externalScannerMode, storeId, products]);

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

      const result = await validateDeviceId(scannedDeviceId, storeId, products);
      if (result.error) {
        setScannerError(result.error);
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
                  deviceSizes: [...item.deviceSizes, product.deviceSize],
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
            deviceSizes: [product.deviceSize],
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
      const product = products.find((p) => p.id === productId);
      if (!product) return;

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
                        product.deviceSizes[product.deviceIds.indexOf(deviceId)] || '',
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
            deviceSizes: deviceId ? [product.deviceSizes[product.deviceIds.indexOf(deviceId)] || ''] : [],
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

    const result = await validateDeviceId(trimmedInput, storeId, products);
    if (result.error) {
      setScannerError(result.error);
      setManualInput('');
      return;
    }

    const { product } = result;
    const canAdd = await checkInventory(product.id, 1, storeId, products);
    if (!canAdd) return;

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

  // Process sale
  const handleProcessSale = useCallback(async () => {
    const success = await processSale(cart, storeId, userId, selectedCustomerId, paymentMethod, vatRate, products, fetchSales);
    if (success) {
      setCart([]);
      setSelectedCustomerId(null);
      setPaymentMethod('Cash');
    }
  }, [cart, storeId, userId, selectedCustomerId, paymentMethod, vatRate, products]);

  // Search products
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.deviceIds.some((id) => id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">

      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Point of Sale</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Add Items</h2>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or ID..."
                className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border rounded dark:border-gray-700">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id)}
                    className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between"
                  >
                    <span>{product.name}</span>
                    <span>{formatCurrency(product.selling_price)}</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="p-2 text-gray-500 dark:text-gray-400">No products found</p>
                )}
              </div>
            )}
            <button
              onClick={() => setScannerActive(true)}
              className="w-full mt-4 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <FaCamera /> Scan Product ID (Webcam)
            </button>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={externalScannerMode}
                onChange={() => setExternalScannerMode((prev) => !prev)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Use External Scanner</span>
            </label>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cart</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item, index) => {
                const product = products.find((p) => p.id === item.dynamic_product_id);
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {product?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.deviceIds.join(', ') || 'No IDs'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        className="w-16 p-1 border rounded dark:bg-gray-800 dark:text-white"
                        min="1"
                      />
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cart.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Cart is empty</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
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
            <div className="mt-4 text-right">
              <p className="text-sm text-gray-900 dark:text-white">
                Subtotal: {formatCurrency(subtotal)}
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                VAT ({(vatRate * 100).toFixed(2)}%): {formatCurrency(vatAmount)}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total: {formatCurrency(total)}
              </p>
              <button
                onClick={handleProcessSale}
                className="w-full mt-2 p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Process Sale
              </button>
            </div>
          </div>
           
        </div>
        <ReceiptModule />
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Recent Sales</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sales.map((sale) => (
              <div key={sale.id} className="border-b dark:border-gray-700 py-2">
                {sale.items.map((item) => {
                  const product = products.find((p) => p.id === item.dynamic_product_id);
                  return (
                    <div key={item.dynamic_product_id} className="text-sm text-gray-900 dark:text-white">
                      {product?.name || 'Unknown'} x {item.quantity} -{' '}
                      {formatCurrency(item.quantity * item.unit_price)}
                      {item.customer_name && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Customer: {item.customer_name}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatCurrency(sale.total_amount)}
                  <br />
                  Date: {new Date(sale.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">No sales recorded</p>
            )}
          </div>
        </div>
        {scannerActive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scan Product ID (Webcam)</h2>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={externalScannerMode}
                  onChange={() => setExternalScannerMode((prev) => !prev)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Use External Scanner</span>
              </label>
              {!externalScannerMode && (
                <>
                  {scannerLoading && (
                    <div className="text-gray-600 dark:text-gray-400 mb-4">Initializing scanner...</div>
                  )}
                  {scannerError && (
                    <div className="text-red-600 dark:text-red-400 mb-4">{scannerError}</div>
                  )}
                  <div id="scanner" className="relative w-full h-48 mb-4">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-24 border-2 border-red-500 bg-transparent opacity-50"></div>
                    </div>
                  </div>
                </>
              )}
              {externalScannerMode && (
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  External scanner active (input detected globally)...
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Or Enter Product ID Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter Product ID"
                    className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleManualInput}
                    className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setScannerActive(false);
                  setScannerError(null);
                  setScannerLoading(false);
                  setManualInput('');
                }}
                className="w-full p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
   
    </div>
  );
}