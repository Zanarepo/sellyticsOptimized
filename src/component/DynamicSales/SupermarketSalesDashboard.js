import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaTrashAlt, FaCamera, FaTimes, FaEdit } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '../../supabaseClient';

const formatCurrency = (value) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function POSSystem() {
  const storeId = localStorage.getItem('store_id') || 'store_123'; // Mock store ID, replace with actual
  const userId = localStorage.getItem('user_id'); // Mock user ID, replace with actual auth
  const [cart, setCart] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [products, setProducts] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [externalScannerMode, setExternalScannerMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);
  const [sales, setSales] = useState([[]]); // Array of arrays for multiple sales
  const [authModal, setAuthModal] = useState({ open: false, action: '', saleIndex: null, saleId: null });
  const [authPassword, setAuthPassword] = useState('');
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef(null);

  // Fetch products from Supabase
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('dynamic_sales')
      .select('device_id')
      .in('device_id', normalizedIds)

    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  }, [storeId]);

  // Fetch sales history
  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
  .from('dynamic_sales')
        .select('device_id')
        .eq('device_id', scannedDeviceId)
        .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(`Failed to fetch sales: ${error.message}`);
      setSales([[]]);
    } else {
      const groupedSales = [data || []]; // Single sale group for simplicity
      setSales(groupedSales);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  // Scanner initialization
  useEffect(() => {
    if (!scannerActive || externalScannerMode) return;

    setScannerLoading(true);
    scannerRef.current = new Html5Qrcode('scanner');

    const config = {
      fps: 10,
      qrbox: { width: 200, height: 100 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      aspectRatio: 1.0,
    };

    const onScanSuccess = async (scannedCode) => {
      const currentTime = Date.now();
      if (currentTime - lastScanTimeRef.current < 500 || lastScannedCodeRef.current === scannedCode) {
        return;
      }
      lastScanTimeRef.current = currentTime;
      lastScannedCodeRef.current = scannedCode;

      const product = products.find((p) => p.barcode === scannedCode);
      if (!product) {
        toast.error(`Product with barcode ${scannedCode} not found`);
        setScannerError(`Product not found`);
        return;
      }

      setCart((prev) => {
        const newCart = [...prev];
        const existingItem = newCart.find((item) => item.productId === product.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          newCart.push({ productId: product.id, quantity: 1, unitPrice: product.price });
        }
        return newCart;
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
  }, [scannerActive, externalScannerMode, products]);

  // External scanner input
  useEffect(() => {
    if (!externalScannerMode || !scannerActive) return;

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeypress = async (e) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50 && buffer) {
        buffer = '';
      }

      if (e.key === 'Enter' && buffer) {
        const scannedCode = buffer.trim();
        const product = products.find((p) => p.barcode === scannedCode);
        if (!product) {
          toast.error(`Product with barcode ${scannedCode} not found`);
          setScannerError(`Product not found`);
          return;
        }

        setCart((prev) => {
          const newCart = [...prev];
          const existingItem = newCart.find((item) => item.productId === product.id);
          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            newCart.push({ productId: product.id, quantity: 1, unitPrice: product.price });
          }
          return newCart;
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
  }, [externalScannerMode, scannerActive, products]);

  // Manual input handler
  const handleManualInput = async () => {
    const trimmedInput = manualInput.trim();
    if (!trimmedInput) {
      toast.error('Product ID cannot be empty');
      return;
    }

    const product = products.find((p) => p.barcode === trimmedInput);
    if (!product) {
      toast.error(`Product with barcode ${trimmedInput} not found`);
      setScannerError(`Product not found`);
      setManualInput('');
      return;
    }

    setCart((prev) => {
      const newCart = [...prev];
      const existingItem = newCart.find((item) => item.productId === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newCart.push({ productId: product.id, quantity: 1, unitPrice: product.price });
      }
      return newCart;
    });
    toast.success(`Added ${product.name}`);
    setManualInput('');
    setScannerError(null);
  };

  // Verify user authorization
  const verifyUserAuth = async () => {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('owner_id', userId)
      .single();

    if (store && !storeError) {
      return true; // Owner or admin
    }

    const { data: storeUser, error: userError } = await supabase
      .from('store_users')
      .select('id, password')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .single();

    if (userError || !storeUser) {
      toast.error('Unauthorized: User not associated with this store');
      return false;
    }

    // Mock password verification (replace with secure auth, e.g., bcrypt)
    if (storeUser.password !== authPassword) {
      toast.error('Incorrect password');
      return false;
    }

    return true;
  };

  const openAuthModal = (action, saleIndex, saleId) => {
    setAuthModal({ open: true, action, saleIndex, saleId });
    setAuthPassword('');
  };

  const handleAuthSubmit = async () => {
    const isAuthorized = await verifyUserAuth();
    if (!isAuthorized) return;

    if (authModal.action === 'edit') {
      const sale = sales[authModal.saleIndex].find((s) => s.id === authModal.saleId);
      if (sale) {
        setCart(sale.items);
      }
    } else if (authModal.action === 'delete') {
      await deleteSale(authModal.saleIndex, authModal.saleId);
    }
    setAuthModal({ open: false, action: '', saleIndex: null, saleId: null });
    setAuthPassword('');
  };

  const addToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const newCart = [...prev];
      const existingItem = newCart.find((item) => item.productId === productId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newCart.push({ productId, quantity: 1, unitPrice: product.price });
      }
      return newCart;
    });
    toast.success(`Added ${product.name}`);
  };

  const updateQuantity = (index, quantity) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].quantity = Math.max(1, parseInt(quantity) || 1);
      return newCart;
    });
  };

  const removeItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const processSale = async () => {
    if (cart.length === 0 || cart.every((item) => !item.productId)) {
      toast.error('Cart is empty');
      return;
    }
    try {
      const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const { data, error } = await supabase.from('sales').insert([
        {
          store_id: storeId,
          items: cart.filter((item) => item.productId),
          total_amount: total,
          created_at: new Date().toISOString(),
        },
      ]).select();
      if (error) throw error;

      setSales((prev) => {
        const newSales = [...prev];
        newSales[currentSaleIndex] = [...newSales[currentSaleIndex], { id: data[0].id, items: cart, total }];
        return newSales;
      });
      setCart([{ productId: '', quantity: 1, unitPrice: 0 }]);
      toast.success('Sale recorded successfully');
    } catch (error) {
      toast.error(`Failed to record sale: ${error.message}`);
    }
  };

  const newSale = () => {
    setSales((prev) => [...prev, []]);
    setCurrentSaleIndex(sales.length);
    setCart([{ productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const deleteSale = async (saleIndex, saleId) => {
    try {
      const { error } = await supabase.from('dynamic_sales').delete().eq('id', saleId).eq('store_id', storeId);
      if (error) throw error;
      setSales((prev) => {
        const newSales = [...prev];
        newSales[saleIndex] = newSales[saleIndex].filter((s) => s.id !== saleId);
        return newSales;
      });
      toast.success('Sale deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete sale: ${error.message}`);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto">
        {/* POS Interface */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">POS System</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id)}
                    className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                  >
                    {product.name}
                    <br />
                    {formatCurrency(product.price)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setScannerActive(true)}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FaCamera /> Scan Barcode
                </button>
              </div>
            </div>
            {/* Cart */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cart</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
                    >
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {product?.name || 'Select Product'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.unitPrice)}
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
              </div>
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total: {formatCurrency(total)}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={processSale}
                    className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Process Sale
                  </button>
                  <button
                    onClick={newSale}
                    className="flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <FaPlus /> New Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales History */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Sale {currentSaleIndex + 1} History</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sales[currentSaleIndex].map((sale) => (
              <div key={sale.id} className="flex justify-between items-center border-b dark:border-gray-700 py-2">
                <div>
                  {sale.items.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div key={item.productId} className="text-sm text-gray-900 dark:text-white">
                        {product?.name || 'Unknown'} x {item.quantity} -{' '}
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    );
                  })}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: {formatCurrency(sale.total_amount)}
                    <br />
                    Date: {new Date(sale.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAuthModal('edit', currentSaleIndex, sale.id)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Edit sale"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openAuthModal('delete', currentSaleIndex, sale.id)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Delete sale"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
            {sales[currentSaleIndex].length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">No sales recorded for this session.</p>
            )}
          </div>
          {/* Sale Navigation */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentSaleIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSaleIndex === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous Sale
            </button>
            <button
              onClick={() => setCurrentSaleIndex((prev) => Math.min(sales.length - 1, prev + 1))}
              disabled={currentSaleIndex === sales.length - 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next Sale
            </button>
          </div>
        </div>

        {/* Scanner Modal */}
        {scannerActive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scan Barcode</h2>
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
                  Waiting for external scanner input...
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Or Enter Barcode Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter Barcode"
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
                  setExternalScannerMode(false);
                }}
                className="w-full p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {authModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Authorize {authModal.action === 'edit' ? 'Edit' : 'Delete'} Sale
              </h2>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthModal({ open: false, action: '', saleIndex: null, saleId: null })}
                  className="flex-1 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthSubmit}
                  className="flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default POSSystem;