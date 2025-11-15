import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaPlus,

  FaFileCsv,
  FaFilePdf,
 
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import { motion } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import ScannerModal from '../DynamicSales/components/ScannerModal';
import SalesForm from './components/SalesForm';
import SalesTable from '../DynamicSales/components/SalesTable';
import { validateAndFetchDevice, hasDuplicateDeviceId } from '../../utils/deviceValidation';
import CreateCustomer from './CreateCustomer'
const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');
  const itemsPerPage = 20;
  const detailPageSize = 20;


// Success sound for scan feedback
const playSuccessSound = () => {
  const audio = new Audio('https://freesound.org/data/previews/171/171671_2437358-lq.mp3');
  audio.play().catch((err) => console.error('Audio play error:', err));
};


  // State Declarations
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [lines, setLines] = useState([
    { dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], deviceSizes: [''], isQuantityManual: false },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [editing, setEditing] = useState(null);
  const [saleForm, setSaleForm] = useState({
    quantity: 1,
    unit_price: '',
    deviceIds: [''],
    deviceSizes: [''],
    payment_method: 'Cash',
    isQuantityManual: false,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [availableDeviceIds, setAvailableDeviceIds] = useState({}); // Object mapping lineIdx to { deviceIds: [], deviceSizes: [] }

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState([]);
  const [detailPage, setDetailPage] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [externalScannerMode, setExternalScannerMode] = useState(false);
  const lastScanTimeRef = useRef(0);
const lastScannedCodeRef = useRef(null);
const [selectedCustomerId, setSelectedCustomerId] = useState(null);
// In SalesTracker.js
const [emailReceipt, setEmailReceipt] = useState(false);
 

  // Refs
  const isProcessingClick = useRef(false);
  const videoRef = useRef(null);
  const scannerDivRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  // Centralized updater to apply a scanned/entered device to either lines or saleForm
  const updateFormWithDevice = useCallback((product, scannedId, deviceSize, modal, lineIdx, deviceIdx) => {
    if (!product || !scannedId) return;

    if (modal === 'add') {
      setLines((ls) => {
        const next = [...ls];
        // Find existing line for same product by name
        const existingLineIdx = next.findIndex(line => {
          const prod = products.find(p => p.id === line.dynamic_product_id);
          return prod && prod.name === product.name;
        });

        if (existingLineIdx !== -1) {
          next[existingLineIdx].deviceIds.push(scannedId);
          next[existingLineIdx].deviceSizes.push(deviceSize || '');
          if (!next[existingLineIdx].isQuantityManual) {
            next[existingLineIdx].quantity = next[existingLineIdx].deviceIds.filter(id => id.trim()).length || 1;
          }
          return next;
        }

        if (!next[lineIdx].dynamic_product_id || next[lineIdx].deviceIds.every(id => !id.trim())) {
          next[lineIdx] = {
            ...next[lineIdx],
            dynamic_product_id: Number(product.id),
            unit_price: Number(product.selling_price),
            deviceIds: [scannedId],
            deviceSizes: [deviceSize || ''],
            quantity: next[lineIdx].isQuantityManual ? next[lineIdx].quantity : 1,
          };
          return next;
        }

        // Otherwise create new line
        next.push({
          dynamic_product_id: Number(product.id),
          quantity: 1,
          unit_price: Number(product.selling_price),
          deviceIds: [scannedId],
          deviceSizes: [deviceSize || ''],
          isQuantityManual: false,
        });
        return next;
      });
    } else if (modal === 'edit') {
      setSaleForm((f) => {
        const updated = { ...f };
        updated.dynamic_product_id = Number(product.id);
        updated.unit_price = Number(product.selling_price);
        updated.deviceIds = [...updated.deviceIds];
        updated.deviceSizes = [...updated.deviceSizes];
        updated.deviceIds[deviceIdx] = scannedId;
        updated.deviceSizes[deviceIdx] = deviceSize || '';
        if (!updated.isQuantityManual) {
          updated.quantity = updated.deviceIds.filter(id => id.trim()).length || 1;
        }
        return updated;
      });
    }
  }, [products]);



const stopScanner = useCallback(async () => {
  if (html5QrCodeRef.current) {
    const currentState = html5QrCodeRef.current.getState();
    if (
      [Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(currentState)
    ) {
      try {
        // Wait briefly to ensure any ongoing transitions complete
        await new Promise((resolve) => setTimeout(resolve, 100));
        await html5QrCodeRef.current.stop();
        console.log('Scanner stopped successfully');
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    } else {
      console.log('Scanner not in active state:', currentState);
      html5QrCodeRef.current = null;
    }
  }
  if (videoRef.current && videoRef.current.srcObject) {
    const tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    videoRef.current = null; // Reset video element
  }
  setScannerError(null);
  setScannerLoading(false);
}, []);


  
  // Computed Values
  const paginatedSales = useMemo(() => {
    if (viewMode !== 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, viewMode]);

  const dailyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = { period: date, total: 0, count: 0 };
      groups[date].total += s.amount;
      groups[date].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const weeklyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at);
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      const key = monday.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = { period: `Week of ${key}`, total: 0, count: 0 };
      groups[key].total += s.amount;
      groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const totalsData = useMemo(() => {
    if (viewMode === 'daily') return dailyTotals;
    if (viewMode === 'weekly') return weeklyTotals;
    return [];
  }, [viewMode, dailyTotals, weeklyTotals]);

  const paginatedTotals = useMemo(() => {
    if (viewMode === 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return totalsData.slice(start, start + itemsPerPage);
  }, [viewMode, totalsData, currentPage]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list') return Math.ceil(filtered.length / itemsPerPage);
    return Math.ceil(totalsData.length / itemsPerPage);
  }, [viewMode, filtered, totalsData]);

  const totalAmount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0), [lines]);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return selectedDeviceInfo.slice(start, end);
  }, [selectedDeviceInfo, detailPage]);

  const totalDetailPages = Math.ceil(selectedDeviceInfo.length / detailPageSize);
  




  
// Utility Function (add above the component)
const formatCurrency = (value) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const checkSoldDevices = useCallback(async (deviceIds, productId, lineIdx) => {
  if (!deviceIds || deviceIds.length === 0) {
    setAvailableDeviceIds(prev => ({ ...prev, [lineIdx]: { deviceIds: [], deviceSizes: [] } }));
    return;
  }
  try {
    const normalizedIds = deviceIds.map(id => id.trim());
    const { data, error } = await supabase
      .from('dynamic_sales')
      .select('device_id')
      .in('device_id', normalizedIds);
    if (error) throw error;
    const soldIds = data.map(item => item.device_id.trim());
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const available = product.deviceIds
      .map((id, idx) => ({ id, size: product.deviceSizes[idx] || '' }))
      .filter(item => !soldIds.includes(item.id));
    setAvailableDeviceIds(prev => ({
      ...prev,
      [lineIdx]: {
        deviceIds: available.map(item => item.id),
        deviceSizes: available.map(item => item.size),
      },
    }));
  } catch (error) {
    console.error('Error fetching sold devices:', error);
    toast.error('Failed to check sold devices');
    setAvailableDeviceIds(prev => ({ ...prev, [lineIdx]: { deviceIds: [], deviceSizes: [] } }));
  }
}, [products]);

  // Onboarding steps
  const onboardingSteps = [
    { target: '.new-sale-button', content: 'Click to record a new sale.' },
    { target: '.search-input', content: 'Search by product, payment method, or product ID.' },
    { target: '.view-mode-selector', content: 'Switch to Daily or Weekly Totals for summaries.' },
  ];

  // Scanner: External Scanner Input
 useEffect(() => {
  if (!externalScannerMode || !scannerTarget || !showScanner) return;

  let buffer = '';
  let lastKeyTime = 0;

  const handleKeypress = async (e) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastKeyTime;

    if (timeDiff > 50 && buffer) {
      buffer = '';
    }

    if (e.key === 'Enter' && buffer) {
      const scannedDeviceId = buffer.trim();
      if (!scannedDeviceId) {
        toast.error('Scanned Product ID cannot be empty');
        setScannerError('Scanned Product ID cannot be empty');
        return;
      }

      const result = await validateAndFetchDevice(scannedDeviceId, storeId);
      if (!result.success) {
        toast.error(result.error);
        setScannerError(result.error);
        return;
      }

      if (!scannerTarget) {
        toast.error('No scanner target set');
        return;
      }

      const { product, deviceSize } = result;
      const { modal, lineIdx, deviceIdx } = scannerTarget;

      if (modal === 'add') {
        if (hasDuplicateDeviceId(lines, scannedDeviceId, lineIdx, deviceIdx)) {
          toast.error(`Product ID "${scannedDeviceId}" already exists`);
          return;
        }
      } else if (modal === 'edit') {
        if (saleForm.deviceIds.some((id, i) => i !== deviceIdx && id.trim().toLowerCase() === scannedDeviceId.toLowerCase())) {
          toast.error(`Product ID "${scannedDeviceId}" already exists in this sale`);
          return;
        }
      }

      updateFormWithDevice(product, scannedDeviceId, deviceSize, modal, lineIdx, deviceIdx);
      setScannerError(null);
      setScannerLoading(false);
      setManualInput('');
      toast.success(`Scanned Product ID: ${scannedDeviceId}`);
      buffer = '';
    } else if (e.key !== 'Enter') {
      buffer += e.key;
    }

    lastKeyTime = currentTime;
  };

  document.addEventListener('keypress', handleKeypress);

  return () => {
    document.removeEventListener('keypress', handleKeypress);
  };
}, [externalScannerMode, scannerTarget, showScanner, lines, saleForm, products, inventory, storeId, checkSoldDevices, updateFormWithDevice]);



  // Scanner: Webcam Scanner

  
  useEffect(() => {
    if (!showScanner || !scannerDivRef.current || !videoRef.current || externalScannerMode) return;

    setScannerLoading(true);
    const currentVideo = videoRef.current;

    try {
      if (!document.getElementById('scanner')) {
        setScannerError('Scanner container not found');
        setScannerLoading(false);
        toast.error('Scanner container not found. Please use manual input.');
        return;
      }

      html5QrCodeRef.current = new Html5Qrcode('scanner');
    } catch (err) {
      setScannerError(`Failed to initialize scanner: ${err.message}`);
      setScannerLoading(false);
      toast.error('Failed to initialize scanner. Please use manual input.');
      return;
    }

const config = {
  fps: 60, // High FPS for instant detection
  qrbox: { width: 250, height: 125 }, // Smaller qrbox for faster focus
  formatsToSupport: [
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.QR_CODE,
  ],
  aspectRatio: 1.0, // Square for better alignment
  disableFlip: true,
  videoConstraints: { width: 1280, height: 720, facingMode: 'environment' }, // Higher resolution
};


const onScanSuccess = async (scannedDeviceId) => {
  const currentTime = Date.now();
  // Debounce: Ignore scans within 500ms or of the same barcode
  if (currentTime - lastScanTimeRef.current < 500 || lastScannedCodeRef.current === scannedDeviceId) {
    return false;
  }
  lastScanTimeRef.current = currentTime;
  lastScannedCodeRef.current = scannedDeviceId;

  playSuccessSound();
  if (!scannedDeviceId) {
    toast.error('Scanned Product ID cannot be empty');
    setScannerError('Scanned Product ID cannot be empty');
    return false;
  }

  console.log('Scanned Device ID:', scannedDeviceId);

  // Check for duplicate in current sale
  if (scannerTarget) {
    const { modal, deviceIdx } = scannerTarget;
    if (modal === 'add') {
      const ls = [...lines];
      if (ls.some(line => line.deviceIds.some(id => id.trim().toLowerCase() === scannedDeviceId.toLowerCase()))) {
        toast.error(`Product ID "${scannedDeviceId}" already exists in this sale`);
        setScannerError(`Product ID "${scannedDeviceId}" already exists`);
        return false;
      }
    } else if (modal === 'edit') {
      if (saleForm.deviceIds.some((id, i) => i !== deviceIdx && id.trim().toLowerCase() === scannedDeviceId.toLowerCase())) {
        toast.error(`Product ID "${scannedDeviceId}" already exists in this sale`);
        setScannerError(`Product ID "${scannedDeviceId}" already exists`);
        return false;
      }
    }
  }

  const result = await validateAndFetchDevice(scannedDeviceId, storeId);
  if (!result.success) {
    toast.error(result.error);
    setScannerError(result.error);
    return false;
  }

  if (scannerTarget) {
    const { modal, lineIdx, deviceIdx } = scannerTarget;

    if (modal === 'add') {
      if (hasDuplicateDeviceId(lines, scannedDeviceId, lineIdx, deviceIdx)) {
        toast.error(`Product ID "${scannedDeviceId}" already exists`);
        return false;
      }
      const { product, deviceSize } = result;
      updateFormWithDevice(product, scannedDeviceId, deviceSize, modal, lineIdx, deviceIdx);
    } else if (modal === 'edit') {
      if (saleForm.deviceIds.some((id, i) => i !== deviceIdx && id.trim().toLowerCase() === scannedDeviceId.toLowerCase())) {
        toast.error(`Product ID "${scannedDeviceId}" already exists in this sale`);
        return false;
      }
      const { product, deviceSize } = result;
      updateFormWithDevice(product, scannedDeviceId, deviceSize, modal, lineIdx, deviceIdx);
    }

    setScannerError(null);
    toast.success(`Scanned Product ID: ${scannedDeviceId}`);
    return true;
  }
  console.error('No scanner target set');
  toast.error('No scanner target set');
  setScannerError('No scanner target set');
  return false;
};




    const onScanFailure = (error) => {
      if (error.includes('No MultiFormat Readers were able to detect the code') ||
          error.includes('No QR code found') ||
          error.includes('IndexSizeError')) {
        console.debug('No barcode detected');
      } else {
        setScannerError(`Scan error: ${error}`);
      }
    };

    const startScanner = async (attempt = 1, maxAttempts = 5) => {
      if (!currentVideo || !scannerDivRef.current) {
        setScannerError('Scanner elements not found');
        setScannerLoading(false);
        toast.error('Scanner elements not found. Please use manual input.');
        return;
      }

      if (attempt > maxAttempts) {
        setScannerError('Failed to initialize scanner after multiple attempts');
        setScannerLoading(false);
        toast.error('Failed to initialize scanner. Please use manual input.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: config.videoConstraints,
        });
        currentVideo.srcObject = stream;
        await new Promise((resolve) => {
          currentVideo.onloadedmetadata = () => resolve();
        });

        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          onScanFailure
        );

        setScannerLoading(false);
      } catch (err) {
        setScannerError(`Failed to initialize scanner: ${err.message}`);
        setScannerLoading(false);
        if (err.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions.');
        } else if (err.name === 'NotFoundError') {
          toast.error('No camera found. Please use manual input.');
        } else {
          setTimeout(() => startScanner(attempt + 1, maxAttempts), 200);
        }
      }
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras.length === 0) {
          setScannerError('No cameras detected. Please use manual input.');
          setScannerLoading(false);
          toast.error('No cameras detected. Please use manual input.');
          return;
        }
        startScanner();
      })
      .catch((err) => {
        setScannerError(`Failed to access cameras: ${err.message}`);
        setScannerLoading(false);
        toast.error('Failed to access cameras. Please use manual input.');
      });
return () => {
    if (html5QrCodeRef.current &&
        [Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(
          html5QrCodeRef.current.getState()
        )) {
      html5QrCodeRef.current
        .stop()
        .then(() => console.log('Webcam scanner stopped'))
        .catch((err) => console.error('Error stopping scanner:', err));
    }
    if (currentVideo && currentVideo.srcObject) {
      currentVideo.srcObject.getTracks().forEach((track) => track.stop());
      currentVideo.srcObject = null;
    }
    html5QrCodeRef.current = null;
  };
 }, [showScanner, scannerTarget, lines, saleForm, externalScannerMode, checkSoldDevices,stopScanner, storeId, products, updateFormWithDevice]);





  
  const openScanner = (modal, lineIdx, deviceIdx) => {
    setScannerTarget({ modal, lineIdx, deviceIdx });
    setShowScanner(true);
    setScannerError(null);
    setScannerLoading(true);
    setManualInput('');
    setExternalScannerMode(false);
  };
const handleManualInput = async () => {
  const trimmedInput = manualInput.trim();
  if (!trimmedInput) {
    toast.error('Product ID cannot be empty');
    setScannerError('Product ID cannot be empty');
    return;
  }

  const result = await validateAndFetchDevice(trimmedInput, storeId);
  if (!result.success) {
    toast.error(result.error);
    setScannerError(result.error);
    setManualInput('');
    return;
  }

  if (!scannerTarget) {
    toast.error('No scanner target set');
    setManualInput('');
    return;
  }

  const { product, deviceSize } = result;
  const { modal, lineIdx, deviceIdx } = scannerTarget;

  // Duplicate checks
  if (modal === 'add') {
    if (hasDuplicateDeviceId(lines, trimmedInput, lineIdx, deviceIdx)) {
      toast.error(`Product ID "${trimmedInput}" already exists`);
      setManualInput('');
      return;
    }
  } else if (modal === 'edit') {
    if (saleForm.deviceIds.some((id, i) => i !== deviceIdx && id.trim().toLowerCase() === trimmedInput.toLowerCase())) {
      toast.error(`Product ID "${trimmedInput}" already exists in this sale`);
      setManualInput('');
      return;
    }
  }

  updateFormWithDevice(product, trimmedInput, deviceSize, modal, lineIdx, deviceIdx);
  setScannerError(null);
  setScannerLoading(false);
  setManualInput('');
  toast.success(`Added Product ID: ${trimmedInput}`);
};



  // Data Fetching
 const fetchProducts = useCallback(async () => {
  if (!storeId) return;
  const { data, error } = await supabase
    .from('dynamic_product')
    .select('id, name, selling_price, dynamic_product_imeis, device_size')
    .eq('store_id', storeId)
    .order('name');
  if (error) {
    toast.error(`Failed to fetch products: ${error.message}`);
    setProducts([]);
  } else {
    const processedProducts = (data || []).map(p => ({
      ...p,
      deviceIds: p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').filter(id => id.trim()) : [],
      deviceSizes: p.device_size ? p.device_size.split(',').filter(size => size.trim()) : [],
    }));
    console.log('Fetched Products:', processedProducts);
    setProducts(processedProducts);
  }
}, [storeId]);


  const fetchInventory = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select('dynamic_product_id, available_qty')
      .eq('store_id', storeId);
    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
    } else {
      setInventory(data || []);
    }
  }, [storeId]);

const fetchSales = useCallback(async () => {
  if (!storeId) return;
  const { data, error } = await supabase
    .from('dynamic_sales')
    .select(`
      id,
      sale_group_id,
      dynamic_product_id,
      quantity,
      unit_price,
      amount,
      payment_method,
      paid_to,
      device_id,
      device_size,
      sold_at,
      customer_id,
      dynamic_product(name),
      customer(fullname)
    `)
    .eq('store_id', storeId)
    .order('sold_at', { ascending: false });
  if (error) {
    toast.error(`Failed to fetch sales: ${error.message}`);
    setSales([]);
    setFiltered([]);
  } else {
    const processedSales = (data || []).map(sale => ({
      ...sale,
      deviceIds: sale.device_id ? sale.device_id.split(',').filter(id => id.trim()) : [],
      deviceSizes: sale.device_size ? sale.device_size.split(',').filter(size => size.trim()) : [],
      customer_name: sale.customer?.fullname || 'N/A', // Add customer_name
    }));
    setSales(processedSales);
    setFiltered(processedSales);
  }
}, [storeId]);


  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchSales();
  }, [fetchProducts, fetchInventory, fetchSales]);

  // Search Filter
   useEffect(() => {
  if (!search) return setFiltered(sales);
  const q = search.toLowerCase();
  setFiltered(
    sales.filter(
      (s) =>
        s.dynamic_product.name.toLowerCase().includes(q) ||
        s.payment_method.toLowerCase().includes(q) ||
        s.deviceIds.some(id => id.toLowerCase().includes(q)) ||
        s.deviceSizes.some(size => size.toLowerCase().includes(q)) ||
        (s.customer_name || '').toLowerCase().includes(q)
    )
  );
  setCurrentPage(1);
}, [search, sales]);

  // Reset Pagination on View Mode Change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);


    /* global gtag */

      useEffect(() => {
        if (typeof gtag === 'function') {
          gtag('event', 'sales_open', {
            event_category: 'App',
            event_label: 'Dashboard Loaded',
          });
        }
      }, []);
    
  
  // Form Handlers
const handleLineChange = async (lineIdx, field, value, deviceIdx = null, isBlur = false) => {
  if (field === 'deviceIds' && deviceIdx !== null) {
    // Update deviceIds immediately without validation on onChange
    setLines((ls) => {
      const next = [...ls];
      next[lineIdx].deviceIds[deviceIdx] = value;
      if (!value.trim()) {
        next[lineIdx].deviceSizes[deviceIdx] = '';
      }
      return next;
    });

    // Perform validation only onBlur or Enter
    if (isBlur && value.trim()) {
      const trimmedInput = value.trim();
      console.log('Validating Device ID:', trimmedInput, 'Line:', lineIdx, 'DeviceIdx:', deviceIdx);

      // Check if device ID is already sold
      const { data: soldData, error: soldError } = await supabase
        .from('dynamic_sales')
        .select('device_id')
        .eq('device_id', trimmedInput)
        .eq('store_id', storeId)
        .single();
      if (soldError && soldError.code !== 'PGRST116') {
        console.error('Error checking sold status:', soldError);
        toast.error('Failed to validate Product ID');
        setLines((ls) => {
          const next = [...ls];
          next[lineIdx].deviceIds[deviceIdx] = '';
          next[lineIdx].deviceSizes[deviceIdx] = '';
          return next;
        });
        return;
      }
      if (soldData) {
        console.log('Device ID is sold:', trimmedInput);
        toast.error(`Product ID "${trimmedInput}" has already been sold`);
        setLines((ls) => {
          const next = [...ls];
          next[lineIdx].deviceIds[deviceIdx] = '';
          next[lineIdx].deviceSizes[deviceIdx] = '';
          return next;
        });
        return;
      }

      // Query dynamic_product for matching device ID
      const { data: productData, error } = await supabase
        .from('dynamic_product')
        .select('id, name, selling_price, dynamic_product_imeis, device_size')
        .eq('store_id', storeId)
        .ilike('dynamic_product_imeis', `%${trimmedInput}%`)
        .limit(1)
        .single();

      setLines((ls) => {
        const next = [...ls];
        if (error || !productData) {
          console.error('Supabase error for Device ID:', error, 'Input:', trimmedInput);
          toast.error(`Product ID "${trimmedInput}" not found`);
          next[lineIdx].deviceIds[deviceIdx] = trimmedInput;
          next[lineIdx].deviceSizes[deviceIdx] = '';
          return next;
        }

        console.log('Found Product for ID:', productData);

        const deviceIds = productData.dynamic_product_imeis ? productData.dynamic_product_imeis.split(',').map(id => id.trim()).filter(id => id) : [];
        const deviceSizes = productData.device_size ? productData.device_size.split(',').map(size => size.trim()).filter(size => size) : [];
        const idIndex = deviceIds.indexOf(trimmedInput);

        const existingLineIdx = next.findIndex(line => {
          const product = products.find(p => p.id === line.dynamic_product_id);
          return product && product.name === productData.name;
        });

        const currentLineProduct = next[lineIdx].dynamic_product_id ? products.find(p => p.id === next[lineIdx].dynamic_product_id) : null;
        const isCurrentLineMatching = currentLineProduct && currentLineProduct.name === productData.name;

        if (existingLineIdx !== -1 && existingLineIdx !== lineIdx) {
          if (next[existingLineIdx].deviceIds.some(id => id.trim().toLowerCase() === trimmedInput.toLowerCase())) {
            toast.error(`Product ID "${trimmedInput}" already exists in this product`);
            next[lineIdx].deviceIds[deviceIdx] = '';
            return next;
          }
          next[existingLineIdx].deviceIds.push(trimmedInput);
          next[existingLineIdx].deviceSizes.push(idIndex !== -1 ? deviceSizes[idIndex] || '' : '');
          if (!next[existingLineIdx].isQuantityManual) {
            next[existingLineIdx].quantity = next[existingLineIdx].deviceIds.filter(id => id.trim()).length || 1;
          }
          next[lineIdx].deviceIds[deviceIdx] = '';
          console.log('Appended to Existing Line:', { existingLineIdx, deviceIds: next[existingLineIdx].deviceIds });
          checkSoldDevices(deviceIds, productData.id, existingLineIdx);
        } else if (isCurrentLineMatching || !next[lineIdx].dynamic_product_id) {
          if (next[lineIdx].deviceIds.some((id, idx) => idx !== deviceIdx && id.trim().toLowerCase() === trimmedInput.toLowerCase())) {
            toast.error(`Product ID "${trimmedInput}" already exists in this line`);
            next[lineIdx].deviceIds[deviceIdx] = '';
            return next;
          }
          next[lineIdx].dynamic_product_id = Number(productData.id);
          next[lineIdx].unit_price = Number(productData.selling_price);
          next[lineIdx].deviceIds[deviceIdx] = trimmedInput;
          next[lineIdx].deviceSizes[deviceIdx] = idIndex !== -1 ? deviceSizes[idIndex] || '' : '';
          if (!next[lineIdx].isQuantityManual) {
            next[lineIdx].quantity = next[lineIdx].deviceIds.filter(id => id.trim()).length || 1;
          }
          console.log('Updated Current Line:', { lineIdx, deviceIds: next[lineIdx].deviceIds });
          checkSoldDevices(deviceIds, productData.id, lineIdx);
          return next;
        } else {
          if (next.some(line => line.deviceIds.some(id => id.trim().toLowerCase() === trimmedInput.toLowerCase()))) {
            toast.error(`Product ID "${trimmedInput}" already exists in another product`);
            next[lineIdx].deviceIds[deviceIdx] = '';
            return next;
          }
          const newLine = {
            dynamic_product_id: Number(productData.id),
            quantity: 1,
            unit_price: Number(productData.selling_price),
            deviceIds: [trimmedInput],
            deviceSizes: [idIndex !== -1 ? deviceSizes[idIndex] || '' : ''],
            isQuantityManual: false,
          };
          next.push(newLine);
          next[lineIdx].deviceIds[deviceIdx] = '';
          console.log('Added New Line:', { newLineIdx: next.length - 1, deviceIds: newLine.deviceIds });
          checkSoldDevices(deviceIds, productData.id, next.length - 1);
        }

        // Cleanup: Clear or remove original row
        console.log('Before cleanup:', { lineIdx, dynamic_product_id: next[lineIdx].dynamic_product_id, deviceIds: next[lineIdx].deviceIds });
        if (next[lineIdx].dynamic_product_id) {
          next[lineIdx].deviceIds = next[lineIdx].deviceIds.map((id, idx) => (idx === deviceIdx ? '' : id));
          next[lineIdx].deviceSizes = next[lineIdx].deviceSizes.map((size, idx) => (idx === deviceIdx ? '' : size));
          if (!next[lineIdx].isQuantityManual) {
            next[lineIdx].quantity = next[lineIdx].deviceIds.filter(id => id.trim()).length || 1;
          }
        } else if (next.length > 1 && next[lineIdx].deviceIds.every(id => !id.trim())) {
          next.splice(lineIdx, 1);
          console.log('Removed empty row:', { lineIdx });
        } else if (next.length === 1 && next[0].deviceIds.every(id => !id.trim())) {
          next[0] = {
            dynamic_product_id: null,
            quantity: 1,
            unit_price: 0,
            deviceIds: [''],
            deviceSizes: [''],
            isQuantityManual: false,
          };
          console.log('Reset only row:', { lineIdx });
        }
        console.log('After cleanup:', { lineIdx, dynamic_product_id: next[lineIdx]?.dynamic_product_id, deviceIds: next[lineIdx]?.deviceIds });

        return next;
      });
    }
  } else {
    setLines((ls) => {
      const next = [...ls];
      if (field === 'deviceSizes' && deviceIdx !== null) {
        next[lineIdx].deviceSizes[deviceIdx] = value;
      } else if (field === 'quantity') {
        next[lineIdx].quantity = +value;
        next[lineIdx].isQuantityManual = true;
      } else if (field === 'unit_price') {
        next[lineIdx].unit_price = +value;
      } else if (field === 'dynamic_product_id') {
        next[lineIdx].dynamic_product_id = +value;
        const prod = products.find((p) => p.id === +value);
        if (prod) {
          next[lineIdx].unit_price = prod.selling_price;
          checkSoldDevices(prod.deviceIds, prod.id, lineIdx);
          next[lineIdx].deviceIds = [];
          next[lineIdx].deviceSizes = [];
          next[lineIdx].quantity = next[lineIdx].isQuantityManual ? next[lineIdx].quantity : 1;
        }
        const inv = inventory.find((i) => i.dynamic_product_id === +value);
        if (inv && inv.available_qty < 6) {
          const prodName = prod?.name || 'this product';
          toast.warning(`Low stock: only ${inv.available_qty} left for ${prodName}`);
        }
      }
      console.log('Updated Lines (Other Fields):', next);
      return next;
    });
  }
};



  const addDeviceId = (e, lineIdx) => {
    e.preventDefault();
    if (isProcessingClick.current) return;
    isProcessingClick.current = true;
    setTimeout(() => { isProcessingClick.current = false; }, 100);
    setLines((ls) => {
      const next = ls.map((line, idx) => {
        if (idx === lineIdx) {
          return {
            ...line,
            deviceIds: [...line.deviceIds, ''],
            deviceSizes: [...line.deviceSizes, ''],
            quantity: line.isQuantityManual ? line.quantity : (line.deviceIds.filter(id => id.trim()).length + 1 || 1),
            isQuantityManual: false,
          };
        }
        return line;
      });
      return next;
    });
  };

  const removeDeviceId = (lineIdx, deviceIdx) => {
    setLines((ls) => {
      const next = [...ls];
      next[lineIdx].deviceIds = next[lineIdx].deviceIds.filter((_, i) => i !== deviceIdx);
      next[lineIdx].deviceSizes = next[lineIdx].deviceSizes.filter((_, i) => i !== deviceIdx);
      if (next[lineIdx].deviceIds.length === 0) {
        next[lineIdx].deviceIds = [''];
        next[lineIdx].deviceSizes = [''];
      }
      if (!next[lineIdx].isQuantityManual) {
        const nonEmptyCount = next[lineIdx].deviceIds.filter(id => id.trim()).length;
        next[lineIdx].quantity = nonEmptyCount || 1;
      }
      next[lineIdx].isQuantityManual = false;
      return next;
    });
  };


  const removeLine = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx));

const handleEditChange = (field, value, deviceIdx = null) => {
  setSaleForm((f) => {
    const next = { ...f };
    if (field === 'deviceIds' && deviceIdx !== null) {
      next.deviceIds[deviceIdx] = value;
      const product = products.find(p => p.id === next.dynamic_product_id);
      if (product && value) {
        const idIndex = product.deviceIds.indexOf(value);
        if (idIndex !== -1) {
          next.deviceSizes[deviceIdx] = product.deviceSizes[idIndex] || '';
        } else {
          next.deviceSizes[deviceIdx] = '';
        }
      }
      if (!next.isQuantityManual) {
        const nonEmptyCount = next.deviceIds.filter(id => id.trim()).length;
        next.quantity = nonEmptyCount || 1;
      }
      next.isQuantityManual = false;
    } else if (field === 'deviceSizes' && deviceIdx !== null) {
      next.deviceSizes[deviceIdx] = value;
    } else if (field === 'quantity') {
      next.quantity = +value;
      next.isQuantityManual = true;
    } else if (field === 'dynamic_product_id') {
      next.dynamic_product_id = +value;
      const prod = products.find((p) => p.id === +value);
      if (prod) {
        next.unit_price = prod.selling_price;
        checkSoldDevices(prod.deviceIds, prod.id, 0);
        next.deviceIds = [''];
        next.deviceSizes = [''];
        next.quantity = next.isQuantityManual ? next.quantity : 1;
      }
    } else if (field === 'customer_id') {
      next.customer_id = Number(value) || null;
    } else {
      next[field] = ['unit_price'].includes(field) ? +value : value;
    }
    return next;
  });
};


  const addEditDeviceId = (e) => {
    e.preventDefault();
    if (isProcessingClick.current) return;
    isProcessingClick.current = true;
    setTimeout(() => { isProcessingClick.current = false; }, 100);
    setSaleForm((f) => {
      const newDeviceIds = [...f.deviceIds, ''];
      const newDeviceSizes = [...f.deviceSizes, ''];
      const nonEmptyCount = newDeviceIds.filter(id => id.trim()).length;
      return {
        ...f,
        deviceIds: newDeviceIds,
        deviceSizes: newDeviceSizes,
        quantity: f.isQuantityManual ? f.quantity : (nonEmptyCount || 1),
        isQuantityManual: false,
      };
    });
  };

  const removeEditDeviceId = (deviceIdx) => {
    setSaleForm((f) => {
      const newDeviceIds = f.deviceIds.filter((_, i) => i !== deviceIdx);
      const newDeviceSizes = f.deviceSizes.filter((_, i) => i !== deviceIdx);
      const nonEmptyCount = newDeviceIds.filter(id => id.trim()).length;
      return {
        ...f,
        deviceIds: newDeviceIds.length === 0 ? [''] : newDeviceIds,
        deviceSizes: newDeviceSizes.length === 0 ? [''] : newDeviceSizes,
        quantity: f.isQuantityManual ? f.quantity : (nonEmptyCount || 1),
        isQuantityManual: false,
      };
    });
  };

  const openDetailModal = (sale) => {
    const deviceInfo = sale.deviceIds.map((id, i) => ({
      id: id || '',
      size: sale.deviceSizes[i] || '',
    }));
    setSelectedDeviceInfo(deviceInfo);
    setDetailPage(1);
    setShowDetailModal(true);
  };

  const createSale = async (e) => {
    // Prevent default if called from form submit
    if (e?.preventDefault) e.preventDefault();
  
    try {
      // === 1. Validation ===
      if (!paymentMethod) {
        toast.error('Please select a payment method.');
        return;
      }
  
      // Validate each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.dynamic_product_id || line.quantity <= 0 || line.unit_price <= 0) {
          toast.error(`Please fill in all required fields for item ${i + 1}.`);
          return;
        }
  
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (!inv || inv.available_qty < line.quantity) {
          const prod = products.find((p) => p.id === line.dynamic_product_id);
          toast.error(
            `Insufficient stock for ${prod?.name || 'product'}: only ${inv?.available_qty || 0} available`
          );
          return;
        }
  
        const deviceIds = line.deviceIds.filter((id) => id.trim());
        if (deviceIds.length > 0) {
          const uniqueIds = new Set(deviceIds);
          if (uniqueIds.size < deviceIds.length) {
            toast.error(`Duplicate Product ID detected in item ${i + 1}`);
            return;
          }
        }
      }
  
      // === 2. Set performer (audit trail) ===
      await supabase.rpc('set_performer', {
        store_id: localStorage.getItem('store_id'),
        user_id: localStorage.getItem('user_id'),
      });
  
      // === 3. Create sale group with email_receipt ===
      const { data: grp, error: grpErr } = await supabase
        .from('sale_groups')
        .insert([
          {
            store_id: storeId,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            customer_id: selectedCustomerId || null,
            email_receipt: emailReceipt, // Correct boolean value
          },
        ])
        .select('id')
        .single();
  
      if (grpErr) throw new Error(`Sale group creation failed: ${grpErr.message}`);
      const groupId = grp.id;
  
      // === 4. Prepare sale lines ===
      const inserts = lines.map((l) => ({
        store_id: storeId,
        sale_group_id: groupId,
        dynamic_product_id: l.dynamic_product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        amount: l.quantity * l.unit_price,
        device_id: l.deviceIds.filter((id) => id.trim()).join(',') || null,
        device_size: l.deviceSizes.filter((s) => s.trim()).join(',') || null,
        payment_method: paymentMethod,
        customer_id: selectedCustomerId || null,
      }));
  
      // === 5. Insert into dynamic_sales ===
      const { error: insErr } = await supabase.from('dynamic_sales').insert(inserts);
      if (insErr) throw new Error(`Sales insertion failed: ${insErr.message}`);
  
      // === 6. Update inventory ===
      for (const line of lines) {
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (inv) {
          const newQty = inv.available_qty - line.quantity;
          const { error } = await supabase
            .from('dynamic_inventory')
            .update({ available_qty: newQty })
            .eq('dynamic_product_id', line.dynamic_product_id)
            .eq('store_id', storeId);
  
          if (error) {
            console.error('Inventory update failed:', error);
            toast.warn(`Warning: Inventory not updated for product ID ${line.dynamic_product_id}`);
          } else {
            setInventory((prev) =>
              prev.map((i) =>
                i.dynamic_product_id === line.dynamic_product_id
                  ? { ...i, available_qty: newQty }
                  : i
              )
            );
          }
        }
      }
  
      // === 7. Success & Reset ===
      toast.success('Sale created successfully!');
      
      // Reset scanner
      stopScanner();
  
      // Close modal
      setShowAdd(false);
  
      // Reset form
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
      setPaymentMethod('Cash');
      setSelectedCustomerId(null);
      setEmailReceipt(false); // Reset email receipt
  
      // Refresh sales
      fetchSales();
    } catch (err) {
      console.error('Sale creation error:', err);
      toast.error(err.message || 'Failed to create sale. Please try again.');
    }
  };
  
const saveEdit = async () => {
  try {
    const originalSale = sales.find((s) => s.id === editing);
    if (!originalSale) throw new Error('Sale not found');

    const quantityDiff = saleForm.quantity - originalSale.quantity;
    if (quantityDiff > 0) {
      const inv = inventory.find((i) => i.dynamic_product_id === saleForm.dynamic_product_id || originalSale.dynamic_product_id);
      if (!inv || inv.available_qty < quantityDiff) {
        throw new Error(
          `Insufficient stock to increase quantity by ${quantityDiff}. Available: ${inv?.available_qty || 0}`
        );
      }
    }

    const deviceIds = saleForm.deviceIds.filter(id => id.trim());
    if (deviceIds.length > 0) {
      const uniqueIds = new Set(deviceIds);
      if (uniqueIds.size < deviceIds.length) {
        toast.error('Duplicate Product IDs detected in this sale');
        return;
      }
    }

    const { error } = await supabase
      .from('dynamic_sales')
      .update({
        dynamic_product_id: saleForm.dynamic_product_id || originalSale.dynamic_product_id,
        quantity: saleForm.quantity,
        unit_price: saleForm.unit_price,
        device_id: deviceIds.join(',') || null,
        device_size: saleForm.deviceSizes.map(size => size.trim() || '').join(',') || null,
        payment_method: saleForm.payment_method || originalSale.payment_method,
        customer_id: saleForm.customer_id, // Add customer_id
      })
      .eq('id', editing);
    if (error) throw new Error(`Update failed: ${error.message}`);

    if (quantityDiff !== 0) {
      const inv = inventory.find((i) => i.dynamic_product_id === saleForm.dynamic_product_id || originalSale.dynamic_product_id);
      if (inv) {
        const newQty = inv.available_qty - quantityDiff;
        await supabase
          .from('dynamic_inventory')
          .update({ available_qty: newQty })
          .eq('dynamic_product_id', saleForm.dynamic_product_id || originalSale.dynamic_product_id)
          .eq('store_id', storeId);
        setInventory((prev) =>
          prev.map((i) =>
            i.dynamic_product_id === (saleForm.dynamic_product_id || originalSale.dynamic_product_id)
              ? { ...i, available_qty: newQty }
              : i
          )
        );
      }
    }

    // Update sale_groups customer_id if necessary
    if (saleForm.customer_id !== originalSale.customer_id) {
      const { error: groupError } = await supabase
        .from('sale_groups')
        .update({ customer_id: saleForm.customer_id })
        .eq('id', originalSale.sale_group_id)
        .eq('store_id', storeId);
      if (groupError) throw new Error(`Sale group update failed: ${groupError.message}`);
    }

    toast.success('Sale updated successfully!');
    stopScanner();
    setEditing(null);
    setSelectedCustomerId(null); // Reset customer selection
    fetchSales();
  } catch (err) {
    toast.error(err.message);
  }
};

  const deleteSale = async (s) => {
    if (!window.confirm(`Delete sale #${s.id}?`)) return;
    try {
      const { error } = await supabase.from('dynamic_sales').delete().eq('id', s.id);
      if (error) throw new Error(`Deletion failed: ${error.message}`);

      const inv = inventory.find((i) => i.dynamic_product_id === s.dynamic_product_id);
      if (inv) {
        const newQty = inv.available_qty + s.quantity;
        await supabase
          .from('dynamic_inventory')
          .update({ available_qty: newQty })
          .eq('dynamic_product_id', s.dynamic_product_id)
          .eq('store_id', storeId);
        setInventory((prev) =>
          prev.map((i) =>
            i.dynamic_product_id === s.dynamic_product_id ? { ...i, available_qty: newQty } : i
          )
        );
      }

      toast.success('Sale deleted successfully!');
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Export Functions
  const exportCSV = () => {
    let csv = '';
    if (viewMode === 'list') {
      csv = 'Product,Product IDs,Product Sizes,Quantity,Unit Price,Amount,Payment Method,Sold At\n';
      filtered.forEach((s) => {
        csv += [
          `"${s.dynamic_product.name.replace(/"/g, '""')}"`,
          s.deviceIds.join(';') || '-',
          s.deviceSizes.join(';') || '-',
          s.quantity,
          s.unit_price.toFixed(2),
          s.amount.toFixed(2),
          s.payment_method,
          `"${new Date(s.sold_at).toLocaleString()}"`,
        ].join(',') + '\n';
      });
    } else {
      csv = 'Period,Total Sales,Number of Sales\n';
      totalsData.forEach((t) => {
        csv += [
          `"${t.period.replace(/"/g, '""')}"`,
          t.total.toFixed(2),
          t.count,
        ].join(',') + '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = viewMode === 'list' ? 'sales.csv' : `${viewMode}_totals.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text(viewMode === 'list' ? 'Sales Report' : `${viewMode.charAt(0).toUpperCase()}${viewMode.slice(1)} Sales Totals`, 10, y);
      y += 10;
      if (viewMode === 'list') {
        filtered.forEach((s) => {
          doc.text(
            `Product: ${s.dynamic_product.name}, Devices: ${s.deviceIds.join(', ') || '-'}, Sizes: ${s.deviceSizes.join(', ') || '-'}, Qty: ${s.quantity}, Unit: ${s.unit_price.toFixed(2)}, Amt: ${s.amount.toFixed(2)}, Pay: ${s.payment_method}, At: ${new Date(s.sold_at).toLocaleString()}`,
            10,
            y
          );
          y += 10;
          if (y > 280) {
            doc.addPage();
            y = 10;
          }
        });
      } else {
        totalsData.forEach((t) => {
          doc.text(`Period: ${t.period}, Total: ${t.total.toFixed(2)}, Sales: ${t.count}`, 10, y);
          y += 10;
          if (y > 280) {
            doc.addPage();
            y = 10;
          }
        });
      }
      doc.save(viewMode === 'list' ? 'sales.pdf' : `${viewMode}_totals.pdf`);
      toast.success('PDF exported successfully!');
    });
  };

  // Onboarding Handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
  };

  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: '0px', left: '0px' };
    const rect = element.getBoundingClientRect();
    return {
      top: `${rect.bottom + window.scrollY + 10}px`,
      left: `${rect.left + window.scrollX}px`,
    };
  };

  // Render
  return (
    <div className="p-2 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white">
      <ToastContainer position="top-right" autoClose={3000} />
    
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 view-mode-selector"
            >
              <option value="list">Individual Sales</option>
              <option value="daily">Daily Totals</option>
              <option value="weekly">Weekly Totals</option>
            
            </select>
              
          </div>
       
          {viewMode === 'list' && (
            <input
              type="text"
              placeholder="Search by product, payment, Product ID, or size…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded w-full sm:w-64 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 search-input"
            />
          )}
             <CreateCustomer/>
        </div>
    
        <button
        
  onClick={() => setShowAdd(true)}
  className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto new-sale-button"
>
  <FaPlus className="text-sm sm:text-base" /> New Sale
</button>

      </div>

  {/* Add Sale Modal */}
  {showAdd && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center sm:items-start justify-center p-4 z-50 overflow-auto mt-0 sm:mt-16">
      <SalesForm
        type="add"
        onSubmit={createSale}
        onCancel={() => { stopScanner(); setShowAdd(false); }}
        lines={lines}
        setLines={setLines}
        removeLine={removeLine}
        products={products}
        handleLineChange={handleLineChange}
        availableDeviceIds={availableDeviceIds}
        openScanner={openScanner}
        removeDeviceId={removeDeviceId}
        addDeviceId={addDeviceId}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        storeId={storeId}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        totalAmount={totalAmount}
        emailReceipt={emailReceipt}          // ADD THIS
    setEmailReceipt={setEmailReceipt}
        
      />
    </div>
  )}


  {/* Edit Sale Modal */}

{editing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center sm:items-start justify-center p-4 z-50 overflow-auto mt-0 sm:mt-16">
<SalesForm
  type="edit"
  onSubmit={(data) => {
    // data contains saleForm, paymentMethod, selectedCustomerId, etc.
    saveEdit(data);
  }}
  onCancel={async () => {
    // reset scanner and editing state
    await stopScanner();
    setShowScanner(false);
    setScannerTarget(null);
    setScannerError(null);
    setScannerLoading(false);
    setManualInput('');
    setExternalScannerMode(false);
    setEditing(null);
    setSelectedCustomerId(null);
      
  }}
  products={products}
  availableDeviceIds={availableDeviceIds}
  openScanner={openScanner}
  saleForm={saleForm}
  handleEditChange={handleEditChange}
  addEditDeviceId={addEditDeviceId}
  removeEditDeviceId={removeEditDeviceId}
  storeId={storeId}
    emailReceipt={emailReceipt}        // ADD THIS
    setEmailReceipt={setEmailReceipt}
        
/>
  </div>
)
}
  {/* Detail Modal */}

      {showDetailModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6">Productss IDs and Sizes</h2>
      <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
        {paginatedDevices.map((device, i) => {
          const displayText = `ID: ${device.id || '-'} (size: ${device.size || '-'})`;
          const q = search.trim().toLowerCase();
          const match = device.id.toLowerCase().includes(q) || device.size.toLowerCase().includes(q);
          return (
            <li
              key={i}
              className={['py-2 px-4', match ? 'bg-yellow-100 dark:bg-yellow-900' : ''].filter(Boolean).join(' ')}
            >
              <span className={match ? 'font-semibold' : ''}>{displayText}</span>
            </li>
          );
        })}
      </ul>
      {totalDetailPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
          <button
            type="button"
            onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
            disabled={detailPage === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Previous
          </button>
          <span>
            Page {detailPage} of {totalDetailPages}
          </span>
          <button
            type="button"
            onClick={() => setDetailPage(p => Math.min(p + 1, totalDetailPages))}
            disabled={detailPage === totalDetailPages}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Next
          </button>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={() => setShowDetailModal(false)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* Scanner Modal */}
      <ScannerModal
        show={showScanner}
        externalScannerMode={externalScannerMode}
        setExternalScannerMode={setExternalScannerMode}
        scannerLoading={scannerLoading}
        scannerError={scannerError}
        scannerDivRef={scannerDivRef}
        videoRef={videoRef}
        manualInput={manualInput}
        setManualInput={setManualInput}
        handleManualInput={handleManualInput}
        onDone={() => {
          setShowScanner(false);
          setScannerTarget(null);
          setScannerError(null);
          setScannerLoading(false);
          setManualInput('');
          setExternalScannerMode(false);
          stopScanner();
        }}
      />

      {/* Sales Table */}
      <SalesTable
        viewMode={viewMode}
        paginatedSales={paginatedSales}
        totalsData={totalsData}
        paginatedTotals={paginatedTotals}
        openDetailModal={openDetailModal}
        formatCurrency={(v) => formatCurrency(v)}
        onEdit={(s) => {
          setEditing(s.id);
          setSaleForm({
            dynamic_product_id: s.dynamic_product_id,
            quantity: s.quantity,
            unit_price: s.unit_price,
            deviceIds: s.deviceIds.length > 0 ? s.deviceIds : [''],
            deviceSizes: s.deviceSizes.length > 0 ? s.deviceSizes : [''],
            payment_method: s.payment_method,
            customer_id: s.customer_id,
            isQuantityManual: false,
          });
          setSelectedCustomerId(s.customer_id);
          const product = products.find(p => p.id === s.dynamic_product_id);
          if (product) {
            checkSoldDevices(product.deviceIds, s.dynamic_product_id, 0);
          }
        }}
        onDelete={(s) => deleteSale(s)}
      />

        {/* Pagination */}
        <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
          >
            Prev
          </button>
          {[...Array(totalPages).keys()].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded transition ${
                currentPage === i + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 w-full sm:w-44 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition export-csv-button"
            title="Export to CSV"
          >
            <FaFileCsv className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 w-full sm:w-44 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition export-pdf-button"
            title="Export to PDF"
          >
            <FaFilePdf className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Onboarding Tooltip */}
        {showOnboarding && onboardingStep < onboardingSteps.length && (
          <motion.div
            className="fixed z-50 bg-indigo-700 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-600 rounded-lg shadow-lg p-4 max-w-xs"
            style={getTooltipPosition(onboardingSteps[onboardingStep].target)}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm text-white dark:text-gray-100 mb-2">
              {onboardingSteps[onboardingStep].content}
            </p>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-300 dark:text-gray-400">
                  {`Step ${onboardingStep + 1} of ${onboardingSteps.length}`}
                </span>
                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={handleSkipOnboarding}
                    className="text-sm text-white dark:text-gray-300 hover:text-gray-200 px-2 py-1"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                  >
                    {onboardingStep + 1 === onboardingSteps.length ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
}