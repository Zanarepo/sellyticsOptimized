import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrashAlt, FaPlus, FaCamera, FaFileCsv, FaDownload } from 'react-icons/fa';
import { uploadProductsFromCSV } from '../UserDashboard/ProductBatchUpload';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import InstructionsModal from '../UserDashboard/InstructionsModal';
import InfoIcon from '../UserDashboard/InfoIcon';

// Success sound for scan feedback
const playSuccessSound = () => {
  const audio = new Audio('https://freesound.org/data/previews/171/171671_2437358-lq.mp3');
  audio.play().catch((err) => console.error('Audio play error:', err));
};

function DynamicProducts({ overrideStoreId }) {
    // Prioritize overrideStoreId if provided (for admin use), else fall back to localStorage
    const storeId = overrideStoreId || localStorage.getItem('store_id');

    const initialAddForm = {
      name: '',
      description: '',
      purchase_price: '',
      purchase_qty: '',
      selling_price: '',
      suppliers_name: '',
      is_unique: false,
      deviceIds: [''],
      deviceSizes: [''],
      deviceId: '',
      deviceSize: ''
    };
    
  // STATES
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

// === UPDATED STATES ===
const [addForm, setAddForm] = useState([
  {
    name: '',
    description: '',
    purchase_price: '',
    purchase_qty: '',           // Only used for non-unique (quantity)
    selling_price: '',
    suppliers_name: '',
    is_unique: false,           // NEW: false = non-unique (generic), true = unique (IMEI list)
    deviceId: '',               // NEW: Generic barcode (non-unique)
    deviceSize: '',             // NEW: Generic size (non-unique)
    deviceIds: [''],            // For unique: list of IDs
    deviceSizes: ['']           // For unique: list of sizes
  },
]);

const [editing, setEditing] = useState(null);

const [editForm, setEditForm] = useState({
  name: '',
  description: '',
  purchase_price: '',
  purchase_qty: '',           // For non-unique: restock amount; for unique: auto-calculated
  selling_price: '',
  suppliers_name: '',
  is_unique: false,           // NEW
  deviceId: '',               // NEW: non-unique
  deviceSize: '',             // NEW: non-unique
  deviceIds: [],              // For unique
  deviceSizes: [],            // For unique
});





  const [showDetail, setShowDetail] = useState(null);
  const [soldDeviceIds, setSoldDeviceIds] = useState([]);
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);
  const [refreshDeviceList, setRefreshDeviceList] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null); // { modal: 'add'|'edit', productIndex: number, deviceIndex: number }
  const [scannerError, setScannerError] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [externalScannerMode, setExternalScannerMode] = useState(false);
  const [scannerBuffer, setScannerBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scanSuccess, setScanSuccess] = useState(false);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 20;
  const [uploadProgress, setUploadProgress] = useState(0);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef(null);
const dropZoneRef = useRef(null);
const [, setUploadMessage] = useState(null);
const [showInstructions, setShowInstructions] = useState(false);

  const downloadCSVTemplate = () => {

    
    const header =
      'name,description,purchase_price,selling_price,suppliers_name,device_ids,device_sizes,purchase_qty';
    const example1 =
      'iPhone 14,Black 128GB,450000,650000,Apple Store,IMEI123;IMEI124,128GB;128GB,';
    const example2 =
      'Samsung Watch,Smartwatch,80000,120000,TechHub,WATCH001;WATCH002,Black;Silver,';
    const example3 =
      'Rice 50kg,Parboiled Rice,25000,35000,FoodMart,,,100';
    const example4 =
      'Cement,Bag of Cement,5000,7000,BuildCo,,,200';
  
    const csvContent = `${header}\n${example1}\n${example2}\n${example3}\n${example4}`;
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV template downloaded');
    
  };

  const handleCSVUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage(null);
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target && typeof e.target.result === 'string'
        ? e.target.result
        : '';

      await uploadProductsFromCSV(
        csvText,
        storeId,
        () => {
          fetchProducts();
        },
        (progress) => setUploadProgress(Math.round(progress)),
        (msg) => {
          setUploadMessage(msg);
          // Auto-close after message appears
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadMessage(null);
          }, 2000);
        }
      );
    };
    reader.readAsText(file);
  };
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target && typeof e.target.result === 'string'
        ? e.target.result
        : '';
  
      await uploadProductsFromCSV(
        csvText,
        storeId,
        () => {
          fetchProducts();
          setIsUploading(false);
          setUploadProgress(0);
        },
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );
    };
    
  // Debouncing refs for scanner
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef(null);

  // Utility Function
  const formatCurrency = (value) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Scanner
  const videoRef = useRef(null);
  const scannerDivRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const manualInputRef = useRef(null);

  const filteredDevices = useMemo(() => {
    return showDetail?.deviceList || [];
  }, [showDetail]);

  const totalDetailPages = Math.ceil(filteredDevices.length / detailPageSize);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return filteredDevices.slice(start, end);
  }, [filteredDevices, detailPage]);

  // Auto-focus manual input
  useEffect(() => {
    if (showScanner && manualInputRef.current) {
      manualInputRef.current.focus();
    }
  }, [showScanner, scannerTarget]);


  
///5
  const processScannedBarcode = useCallback((scannedCode) => {
    const trimmedCode = scannedCode.trim();
    console.log('Processing barcode:', { trimmedCode });
    if (!trimmedCode) {
      toast.error('Invalid barcode: Empty value');
      setScannerError('Invalid barcode: Empty value');
      return false;
    }
    if (scannerTarget) {
      const { modal, productIndex, deviceIndex, isUnique } = scannerTarget;
      let newDeviceIndex = deviceIndex;
      if (isUnique) {
        // Unique logic: Multi-IDs, check duplicates, add new field
        if (modal === 'add') {
          const form = [...addForm];
          if (form[productIndex].deviceIds.some((id, i) => i !== deviceIndex && id.trim().toLowerCase() === trimmedCode.toLowerCase())) {
            toast.error(`Barcode "${trimmedCode}" already exists in this product`);
            setScannerError(`Barcode "${trimmedCode}" already exists`);
            return false;
          }
          form[productIndex].deviceIds[deviceIndex] = trimmedCode;
          form[productIndex].deviceIds.push('');
          form[productIndex].deviceSizes[deviceIndex] = form[productIndex].deviceSizes[deviceIndex] || '';
          form[productIndex].deviceSizes.push('');
          setAddForm(form);
          newDeviceIndex = form[productIndex].deviceIds.length - 1;
        } else if (modal === 'edit') {
          if (editForm.deviceIds.some((id, i) => i !== deviceIndex && id.trim().toLowerCase() === trimmedCode.toLowerCase())) {
            toast.error(`Barcode "${trimmedCode}" already exists in this product`);
            setScannerError(`Barcode "${trimmedCode}" already exists`);
            return false;
          }
          const arrIds = [...editForm.deviceIds];
          const arrSizes = [...editForm.deviceSizes];
          arrIds[deviceIndex] = trimmedCode;
          arrIds.push('');
          arrSizes[deviceIndex] = arrSizes[deviceIndex] || '';
          arrSizes.push('');
          setEditForm((prev) => ({ ...prev, deviceIds: arrIds, deviceSizes: arrSizes }));
          newDeviceIndex = arrIds.length - 1;
        }
      } else {
        // Non-unique logic: Single barcode, no duplicates/add, just set
        if (modal === 'add') {
          const form = [...addForm];
          form[productIndex].deviceId = trimmedCode;
          setAddForm(form);
        } else if (modal === 'edit') {
          setEditForm((prev) => ({ ...prev, deviceId: trimmedCode }));
        }
      }
      setScannerTarget({
        ...scannerTarget,
        deviceIndex: newDeviceIndex,
      });
      setScannerError(null);
      toast.success(`Scanned barcode: ${trimmedCode}`);
      return true;
    }
    return false;
  }, [scannerTarget, addForm, editForm]);

 
 //6

 const handleToggleAddUnique = (pIdx, checked) => {
  const f = [...addForm];
  f[pIdx].is_unique = checked;
  if (checked) {
    // Switch to unique: Move single to array
    f[pIdx].deviceIds = [f[pIdx].deviceId || ''];
    f[pIdx].deviceSizes = [f[pIdx].deviceSize || ''];
    f[pIdx].deviceId = '';
    f[pIdx].deviceSize = '';
    f[pIdx].purchase_qty = '';
  } else {
    // Switch to non-unique: Move first from array to single
    f[pIdx].deviceId = f[pIdx].deviceIds[0] || '';
    f[pIdx].deviceSize = f[pIdx].deviceSizes[0] || '';
    f[pIdx].deviceIds = [''];
    f[pIdx].deviceSizes = [''];
  }
  setAddForm(f);
};
//6
const handleToggleEditUnique = (checked) => {
  setEditForm((prev) => {
    const newForm = { ...prev, is_unique: checked };
    if (checked) {
      newForm.deviceIds = [prev.deviceId || ''];
      newForm.deviceSizes = [prev.deviceSize || ''];
      newForm.deviceId = '';
      newForm.deviceSize = '';
      newForm.purchase_qty = '';
    } else {
      newForm.deviceId = prev.deviceIds[0] || '';
      newForm.deviceSize = prev.deviceSizes[0] || '';
      newForm.deviceIds = [];
      newForm.deviceSizes = [];
    }
    return newForm;
  });
};

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
  // External scanner input
  useEffect(() => {
    if (!externalScannerMode || !scannerTarget || !showScanner) return;

    const handleKeypress = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      if (timeDiff > 50 && scannerBuffer) {
        setScannerBuffer('');
      }

      if (e.key === 'Enter' && scannerBuffer) {
        const success = processScannedBarcode(scannerBuffer);
        if (success) {
          setScannerBuffer('');
          setManualInput('');
          if (manualInputRef.current) {
            manualInputRef.current.focus();
          }
        }
      } else if (e.key !== 'Enter') {
        setScannerBuffer((prev) => prev + e.key);
      }

      setLastKeyTime(currentTime);
    };

    document.addEventListener('keypress', handleKeypress);

    return () => {
      document.removeEventListener('keypress', handleKeypress);
    };
  }, [externalScannerMode, scannerTarget, scannerBuffer, lastKeyTime, showScanner, processScannedBarcode]);

  // Webcam scanner
  useEffect(() => {
    if (!showScanner || !scannerDivRef.current || !videoRef.current || externalScannerMode) return;

    console.log('Scanner modal opened:', {
      modal: scannerTarget?.modal,
      productIndex: scannerTarget?.productIndex,
      deviceIndex: scannerTarget?.deviceIndex,
      scannerDivExists: !!document.getElementById('scanner'),
    });

    setScannerLoading(true);
    setScanSuccess(false);

    const videoElement = videoRef.current;
    let html5QrCodeInstance = null;

    try {
      if (!document.getElementById('scanner')) {
        console.error('Scanner div not found in DOM');
        setScannerError('Scanner container not found. Please use manual input.');
        setScannerLoading(false);
        toast.error('Scanner container not found. Please use manual input.');
        return;
      }

      html5QrCodeInstance = new Html5Qrcode('scanner');
      html5QrCodeRef.current = html5QrCodeInstance;
      console.log('Html5Qrcode instance created successfully');
    } catch (err) {
      console.error('Failed to create Html5Qrcode instance:', err);
      setScannerError(`Failed to initialize scanner: ${err.message}`);
      setScannerLoading(false);
      toast.error('Failed to initialize scanner. Please use manual input.');
      return;
    }

    const config = {
      fps: 60,
      qrbox: { width: 250, height: 125 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      aspectRatio: 1.0,
      disableFlip: true,
      videoConstraints: { width: 1280, height: 720, facingMode: 'environment' },
    };

    const onScanSuccess = (decodedText) => {
      const currentTime = Date.now();
      if (currentTime - lastScanTimeRef.current < 500 || lastScannedCodeRef.current === decodedText) {
        return; // Ignore duplicate scans within 500ms or same code
      }
      lastScanTimeRef.current = currentTime;
      lastScannedCodeRef.current = decodedText;
      const success = processScannedBarcode(decodedText);
      if (success) {
        setScanSuccess(true);
        playSuccessSound();
        setTimeout(() => setScanSuccess(false), 1000);
        setManualInput('');
        if (manualInputRef.current) {
          manualInputRef.current.focus();
        }
      }
    };

    const onScanFailure = (error) => {
      if (
        error.includes('No MultiFormat Readers were able to detect the code') ||
        error.includes('No QR code found') ||
        error.includes('IndexSizeError')
      ) {
        console.debug('No barcode detected in frame');
      } else {
        console.error('Scan error:', error);
        setScannerError(`Scan error: ${error}. Try adjusting lighting or distance.`);
      }
    };

    const startScanner = async (attempt = 1, maxAttempts = 3) => {
      if (!videoElement || !scannerDivRef.current) {
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
      console.log(`Starting webcam scanner (attempt ${attempt})`);
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              ...config.videoConstraints,
              advanced: [{ focusMode: 'continuous' }],
            },
          });
        } catch (err) {
          console.warn('Rear camera with autofocus failed, trying fallback:', err);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }
        videoElement.srcObject = stream;
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => resolve();
        });
        await html5QrCodeInstance.start(
          config.videoConstraints,
          config,
          onScanSuccess,
          onScanFailure
        );
        console.log('Webcam scanner started successfully');
        setScannerLoading(false);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setScannerError(`Failed to initialize scanner: ${err.message}`);
        setScannerLoading(false);
        if (err.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions.');
        } else if (err.name === 'NotFoundError') {
          toast.error('No camera found. Please use manual input.');
        } else if (err.name === 'OverconstrainedError') {
          toast.error('Camera constraints not supported. Trying fallback...');
          setTimeout(() => startScanner(attempt + 1, maxAttempts), 200);
        } else {
          toast.error('Failed to start camera. Please use manual input.');
        }
      }
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        console.log('Available cameras:', cameras.map(c => ({ id: c.id, label: c.label })));
        if (cameras.length === 0) {
          setScannerError('No cameras detected. Please use manual input.');
          setScannerLoading(false);
          toast.error('No cameras detected. Please use manual input.');
          return;
        }
        startScanner();
      })
      .catch((err) => {
        console.error('Error listing cameras:', err);
        setScannerError(`Failed to access cameras: ${err.message}`);
        setScannerLoading(false);
        toast.error('Failed to access cameras. Please use manual input.');
      });

    return () => {
      console.log('Scanner cleanup initiated');
      if (html5QrCodeInstance && 
          [Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(
            html5QrCodeInstance.getState()
          )) {
        html5QrCodeInstance
          .stop()
          .then(() => console.log('Webcam scanner stopped successfully'))
          .catch((err) => console.error('Error stopping scanner:', err));
      }
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => {
          console.log('Stopping video track:', track.label);
          track.stop();
        });
        videoElement.srcObject = null;
      }
      html5QrCodeRef.current = null;
    };
  }, [showScanner, scannerTarget, externalScannerMode, processScannedBarcode]);

  // Stop scanner
  const stopScanner = useCallback(() => {
    console.log('Stopping scanner');
    if (html5QrCodeRef.current && 
        [Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(
          html5QrCodeRef.current.getState()
        )) {
      html5QrCodeRef.current
        .stop()
        .then(() => console.log('Scanner stopped successfully'))
        .catch((err) => console.error('Error stopping scanner:', err));
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => {
        console.log('Stopped video track:', track.label);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    html5QrCodeRef.current = null;
  }, []);

  // Fetch products
 
const fetchProducts = useCallback(async () => {
  if (!storeId) {
    console.error('Store ID not found');
    toast.error('Store ID not found');
    return;
  }
  try {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, purchase_qty, selling_price, suppliers_name, device_id, dynamic_product_imeis, device_size, is_unique, created_at') // Updated: add is_unique
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (error) throw error;
    
    const withIds = (data || []).map((p) => ({
      ...p,
      is_unique: p.is_unique ?? false, // Default to false if not set
      deviceList: p.is_unique 
        ? (p.dynamic_product_imeis && typeof p.dynamic_product_imeis === 'string' ? p.dynamic_product_imeis.split(',').filter((id) => id && id.trim()) : []) 
        : [], // Empty for non-unique
      sizeList: p.is_unique 
        ? (p.device_size && typeof p.device_size === 'string' ? p.device_size.split(',').filter((size) => size && size.trim()) : []) 
        : [], // Empty for non-unique
      device_id: !p.is_unique ? p.device_id : null, // Generic barcode for non-unique
      device_size: !p.is_unique ? p.device_size : null, // Single size for non-unique
      purchase_qty: p.purchase_qty || 0,
    }));
    setProducts(withIds);
    setFiltered(withIds);
  } catch (error) {
    console.error('Fetch products error:', error);
    toast.error(`Failed to fetch products: ${error.message || 'Unknown error'}`);
  }
}, [storeId]);








  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshDeviceList]);

  // Search filter
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.deviceList.some((id) => id.toLowerCase().includes(q)) ||
            p.sizeList.some((size) => size.toLowerCase().includes(q))
        )
      );
    }
    setCurrentPage(1);
  }, [search, products]);

  // Check sold devices
  const checkSoldDevices = useCallback(async (deviceIds) => {
    if (!deviceIds || deviceIds.length === 0) return [];
    setIsLoadingSoldStatus(true);
    try {
      const normalizedIds = deviceIds.map((id) => id.trim());
      const { data, error } = await supabase
        .from('dynamic_sales')
        .select('device_id')
        .in('device_id', normalizedIds);
      if (error) throw error;
      const soldIds = data.map((item) => item.device_id.trim());
      setSoldDeviceIds(soldIds);
      return soldIds;
    } catch (error) {
      console.error('Error fetching sold devices:', error);
      toast.error('Failed to check sold devices');
      return [];
    } finally {
      setIsLoadingSoldStatus(false);
    }
  }, []);

  useEffect(() => {
    if (showDetail && showDetail.deviceList.length > 0) {
      checkSoldDevices(showDetail.deviceList);
    } else {
      setSoldDeviceIds([]);
    }
  }, [showDetail, checkSoldDevices]);

  // Open scanner
  const openScanner = (modal, productIndex, deviceIndex, isUnique) => {
    console.log('Opening scanner:', { modal, productIndex, deviceIndex, isUnique });
    setScannerTarget({ modal, productIndex, deviceIndex, isUnique });
    setShowScanner(true);
    setScannerError(null);
    setScannerLoading(true);
    setManualInput('');
    setExternalScannerMode(false);
    setScannerBuffer('');
  };

  // Handle manual input
  const handleManualInput = () => {
    const trimmedInput = manualInput.trim();
    const success = processScannedBarcode(trimmedInput);
    if (success) {
      setManualInput('');
      if (manualInputRef.current) {
        manualInputRef.current.focus();
      }
    }
  };

  // Handle Enter key for manual input
  const handleManualInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualInput();
    }
  };

  // Remove device ID
  const removeDeviceId = async (deviceId) => {
    if (!showDetail || !deviceId) return;
  
    const isUnique = showDetail.is_unique === true;
  
    // === NON-UNIQUE: Cannot remove individual barcode items ===
    if (!isUnique) {
      toast.error('Cannot remove individual items from non-unique products. Edit quantity in product settings.');
      return;
    }
  
    // === UNIQUE: Proceed with removal ===
    if (!window.confirm(`Remove device ID "${deviceId}" from "${showDetail.name}"?`)) return;
  
    try {
      const deviceList = showDetail.deviceList || [];
      const sizeList = showDetail.sizeList || [];
      const index = deviceList.indexOf(deviceId);
  
      if (index === -1) {
        toast.error('Device ID not found');
        return;
      }
  
      // Remove from arrays
      const updatedDeviceList = deviceList.filter((_, i) => i !== index);
      const updatedSizeList = sizeList.filter((_, i) => i !== index);
  
      // Update product record
      const { error: productError } = await supabase
        .from('dynamic_product')
        .update({
          dynamic_product_imeis: updatedDeviceList.length > 0 ? updatedDeviceList.join(',') : null,
          device_size: updatedSizeList.length > 0 ? updatedSizeList.join(',') : null,
          // Only update purchase_qty if this was the last IMEI and it was unique
          purchase_qty: updatedDeviceList.length > 0 ? updatedDeviceList.length : 0,
        })
        .eq('id', showDetail.id);
  
      if (productError) throw productError;
  
      // Update inventory: decrease available_qty by 1
      const { data: inv, error: invError } = await supabase
        .from('dynamic_inventory')
        .select('available_qty')
        .eq('dynamic_product_id', showDetail.id)
        .eq('store_id', storeId)
        .maybeSingle();
  
      if (invError) throw invError;
  
      if (inv) {
        const newAvailableQty = Math.max(0, (inv.available_qty || 0) - 1);
        await supabase
          .from('dynamic_inventory')
          .update({
            available_qty: newAvailableQty,
            last_updated: new Date().toISOString(),
          })
          .eq('dynamic_product_id', showDetail.id)
          .eq('store_id', storeId);
      }
  
      // Update local state
      setShowDetail({
        ...showDetail,
        deviceList: updatedDeviceList,
        sizeList: updatedSizeList,
        purchase_qty: updatedDeviceList.length,
      });
  
      setRefreshDeviceList((prev) => !prev);
      toast.success('Device ID removed successfully');
    } catch (error) {
      console.error('Error removing device ID:', error);
      toast.error(`Failed to remove device ID: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Pagination
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  // Add handlers
// Add handlers
const handleAddChange = (idx, field, val) => {
  const f = [...addForm];

  // Quantity must always be a number
  if (field === "purchase_qty") {
    f[idx][field] = parseInt(val) || 0;
  } else {
    f[idx][field] = val;
  }

  setAddForm(f);
};


  const handleAddId = (pIdx, iIdx, val) => {
    const f = [...addForm];
    const trimmedVal = val.trim();
    if (trimmedVal && f[pIdx].deviceIds.some((id, i) => i !== iIdx && id.trim().toLowerCase() === trimmedVal.toLowerCase())) {
      toast.error(`Barcode "${trimmedVal}" already exists in this product`);
      return;
    }
    f[pIdx].deviceIds[iIdx] = val;
    setAddForm(f);
  };

  const handleAddSize = (pIdx, iIdx, val) => {
    const f = [...addForm];
    f[pIdx].deviceSizes[iIdx] = val || '';
    setAddForm(f);
  };

  const addIdField = (pIdx) => {
    const f = [...addForm];
    f[pIdx].deviceIds.push('');
    f[pIdx].deviceSizes.push('');
    setAddForm(f);
  };

  const removeIdField = (pIdx, iIdx) => {
    const f = [...addForm];
    f[pIdx].deviceIds.splice(iIdx, 1);
    f[pIdx].deviceSizes.splice(iIdx, 1);
    setAddForm(f);
  };

  const addAnotherProduct = () => {
    
    setAddForm((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        purchase_price: '',
        purchase_qty: '',
        selling_price: '',
        suppliers_name: '',
        deviceIds: [''],
        deviceSizes: [''],
      },
    ]);
  };
  const removeLastProduct = () => {
    if (addForm.length > 1) {
      const updated = [...addForm];
      updated.pop();
      setAddForm(updated);
    }
  };
  
  const removeProductForm = (index) => {
    setAddForm((prev) => prev.filter((_, i) => i !== index));
  };












  // Create products
 
const createProducts = async (e) => {
  e.preventDefault();
  if (!addForm.length) {
    toast.error('Add at least one product');
    return;
  }
  for (const p of addForm) {
    if (!p.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    let deviceIdList = [];
    if (p.is_unique) {
      deviceIdList = p.deviceIds.filter((d) => d.trim());
      if (deviceIdList.length === 0) {
        toast.error('At least one unique ID required for unique products');
        return;
      }
      const uniqueNewIds = new Set(deviceIdList.map((id) => id.toLowerCase()));
      if (uniqueNewIds.size < deviceIdList.length) {
        toast.error('Duplicate unique IDs within the product');
        return;
      }

      
    } else {
      const qty = parseInt(p.purchase_qty);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Quantity required for non-unique products');
        return;
      }
    }
    
  }




  try {
    const allNewUniqueIds = addForm.flatMap((p) => p.is_unique ? p.deviceIds.filter((id) => id.trim()) : []);
    if (allNewUniqueIds.length > 0) {
      const uniqueSet = new Set(allNewUniqueIds.map((id) => id.toLowerCase()));
      if (uniqueSet.size < allNewUniqueIds.length) {
        toast.error('Duplicate unique IDs detected');
        return;
      }
      const { data: existingProducts, error: fetchError } = await supabase
        .from('dynamic_product')
        .select('id, dynamic_product_imeis')
        .eq('store_id', storeId);
      if (fetchError) throw fetchError;
      const existingIds = existingProducts.flatMap((p) =>
        p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').map((id) => id.trim()) : []
      ).filter((id) => id);
      const duplicates = allNewUniqueIds.filter((id) => existingIds.some((eId) => eId.toLowerCase() === id.toLowerCase()));
      if (duplicates.length > 0) {
        toast.error(`Duplicate unique IDs exist: ${duplicates.join(', ')}`);
        return;
      }
    }
    const productsToInsert = addForm.map((p) => {
      let calculatedQty = 0;
      let dynamic_product_imeis = null;
      let device_size = null;
      let device_id = null;
      if (p.is_unique) {
        const deviceIdList = p.deviceIds.filter((d) => d.trim());
        calculatedQty = deviceIdList.length;
        dynamic_product_imeis = deviceIdList.join(',') || null;
        device_size = p.deviceSizes.slice(0, deviceIdList.length).map((s) => (s || '').trim()).join(',') || null;
      } else {
        calculatedQty = parseInt(p.purchase_qty) || 0;
        device_id = (p.deviceId || '').trim() || null;
        device_size = (p.deviceSize || '').trim() || null;
      }
      return {
        store_id: storeId,
        name: p.name.trim(),
        description: (p.description || '').trim(),
        purchase_price: parseFloat(p.purchase_price) || 0,
        purchase_qty: calculatedQty,
        selling_price: parseFloat(p.selling_price) || 0,
        suppliers_name: (p.suppliers_name || '').trim(),
        is_unique: p.is_unique, // New
        dynamic_product_imeis,
        device_size,
        device_id, // New for non-unique
      };
    });
    const { data: newProds, error } = await supabase
      .from('dynamic_product')
      .insert(productsToInsert)
      .select('id, is_unique, dynamic_product_imeis, device_id, purchase_qty');
    if (error) throw error;
    const invUpdates = newProds.map((p) => ({
      dynamic_product_id: p.id,
      store_id: storeId,
      available_qty: p.purchase_qty, // Initial available = purchase_qty
      quantity_sold: 0,
      last_updated: new Date().toISOString(),
    }));
    await supabase.from('dynamic_inventory').upsert(invUpdates, { onConflict: ['dynamic_product_id', 'store_id'] });
    toast.success('Products added successfully');
    // ... keep reset and fetch
  } catch (error) {
    console.error('Create products error:', error);
    toast.error(`Failed to add products: ${error.message || 'Unknown error'}`);
    setShowAdd(false);          // close modal
setAddForm([initialAddForm]); // reset form
fetchProducts();             // update table

  }
};

  


// Edit functionality
  const openEdit = async (p) => {
    let deviceIds = [];
    let deviceSizes = [];
    let deviceId = '';
    let deviceSize = '';
    const isUnique = p.is_unique ?? false;
  
    // Fetch current inventory available_qty (used for non-unique purchase_qty display)
    let currentInventoryQty = p.purchase_qty || 0;
    try {
      const { data: inv } = await supabase
        .from('dynamic_inventory')
        .select('available_qty')
        .eq('dynamic_product_id', p.id)
        .eq('store_id', storeId)
        .maybeSingle();
      if (inv && inv.available_qty !== null && inv.available_qty !== undefined) {
        currentInventoryQty = inv.available_qty;
      }
    } catch (err) {
      console.warn('Could not fetch inventory for edit:', err);
    }
  
    if (isUnique) {
      deviceIds = [...(p.deviceList || []), ''];
      deviceSizes = deviceIds.map((_, i) => (i < (p.sizeList || []).length ? p.sizeList[i] : ''));
    } else {
      deviceId = p.device_id || '';
      deviceSize = p.device_size || '';
    }
  
    setEditing({
      ...p,
      is_unique: isUnique,
      deviceIds,
      deviceSizes,
      deviceId,
      deviceSize,
    });
    setEditForm({
      name: p.name || '',
      description: p.description || '',
      purchase_price: p.purchase_price || '',
      purchase_qty: isUnique ? (p.deviceList || []).length : currentInventoryQty, // For unique: current count; for non-unique: available
      selling_price: p.selling_price || '',
      suppliers_name: p.suppliers_name || '',
      is_unique: isUnique,
      deviceIds,
      deviceSizes,
      deviceId,
      deviceSize,
    });
  };



  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeviceIdChange = (idx, val) => {
    const trimmedVal = val.trim();
    if (trimmedVal && editForm.deviceIds.some((id, i) => i !== idx && id.trim().toLowerCase() === trimmedVal.toLowerCase())) {
      toast.error(`Barcode "${trimmedVal}" already exists in this product`);
      return;
    }
    const arrIds = [...editForm.deviceIds];
    arrIds[idx] = val;
    setEditForm((prev) => ({
      ...prev,
      deviceIds: arrIds,
      deviceSizes: prev.deviceSizes || arrIds.map(() => ''),
    }));
  };

  const handleDeviceSizeChange = (idx, val) => {
    const arrSizes = [...editForm.deviceSizes || []];
    arrSizes[idx] = val || '';
    setEditForm((prev) => ({
      ...prev,
      deviceSizes: arrSizes,
    }));
  };

  const addDeviceId = () => {
    setEditForm((prev) => ({
      ...prev,
      deviceIds: [...prev.deviceIds, ''],
      deviceSizes: [...(prev.deviceSizes || []), ''],
    }));
  };

  const removeEditDeviceId = (idx) => {
    setEditForm((prev) => ({
      ...prev,
      deviceIds: prev.deviceIds.filter((_, i) => i !== idx),
      deviceSizes: (prev.deviceSizes || []).filter((_, i) => i !== idx),
    }));
  };



  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const isUnique = editForm.is_unique;
    let cleanedDeviceIds = [];
    let cleanedDeviceSizes = [];
    let deviceId = null;
    let deviceSize = null;
    let inventoryChange = 0;
    let calculatedPurchaseQty = editing.purchase_qty || 0; // Start with original
  
    if (isUnique) {
      cleanedDeviceIds = editForm.deviceIds.filter((id) => id.trim());
      cleanedDeviceSizes = editForm.deviceSizes.slice(0, cleanedDeviceIds.length).map((s) => (s || '').trim());
      if (cleanedDeviceIds.length === 0) {
        toast.error('At least one unique ID required');
        return;
      }
      const uniqueSet = new Set(cleanedDeviceIds.map((id) => id.toLowerCase()));
      if (uniqueSet.size < cleanedDeviceIds.length) {
        toast.error('Duplicate unique IDs');
        return;
      }
      const { data: existingProducts, error: fetchError } = await supabase
        .from('dynamic_product')
        .select('id, dynamic_product_imeis')
        .eq('store_id', storeId)
        .neq('id', editing.id);
      if (fetchError) throw fetchError;
      const existingIds = existingProducts.flatMap((p) =>
        p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').map((id) => id.trim()) : []
      ).filter((id) => id);
      const duplicates = cleanedDeviceIds.filter((id) => existingIds.some((eId) => eId.toLowerCase() === id.toLowerCase()));
      if (duplicates.length > 0) {
        toast.error(`Unique IDs exist in other products: ${duplicates.join(', ')}`);
        return;
      }
      // For unique: Calculate changes
      const originalDeviceIds = (editing.deviceList || []).map((id) => id.trim());
      const newDeviceIds = cleanedDeviceIds.filter((id) => !originalDeviceIds.some((orig) => orig.toLowerCase() === id.toLowerCase()));
      const removedDeviceIds = originalDeviceIds.filter((id) => !cleanedDeviceIds.some((newId) => newId.toLowerCase() === id.toLowerCase()));
      inventoryChange = newDeviceIds.length - removedDeviceIds.length;
      calculatedPurchaseQty = cleanedDeviceIds.length; // Total purchased updates to new list length
    } else {
      const restockQty = parseInt(editForm.purchase_qty) || 0;
      if (restockQty < 0) {
        toast.error('Quantity cannot be negative');
        return;
      }
      inventoryChange = Math.max(0, restockQty);
      calculatedPurchaseQty += inventoryChange; // Add restock to total purchased
      deviceId = editForm.deviceId.trim() || null;
      deviceSize = editForm.deviceSize.trim() || null;
    }
    try {
      const { error: prodErr } = await supabase
        .from('dynamic_product')
        .update({
          name: editForm.name.trim(),
          description: (editForm.description || '').trim(),
          purchase_price: parseFloat(editForm.purchase_price) || 0,
          purchase_qty: calculatedPurchaseQty,
          selling_price: parseFloat(editForm.selling_price) || 0,
          suppliers_name: (editForm.suppliers_name || '').trim(),
          is_unique: isUnique, 
          dynamic_product_imeis: isUnique ? cleanedDeviceIds.join(',') || null : null,
          device_size: isUnique ? cleanedDeviceSizes.join(',') || null : deviceSize,
          device_id: !isUnique ? deviceId : null,
        })
        .eq('id', editing.id);
      if (prodErr) throw prodErr;
  
      const { data: inv, error: invError } = await supabase
        .from('dynamic_inventory')
        .select('available_qty, quantity_sold')
        .eq('dynamic_product_id', editing.id)
        .eq('store_id', storeId)
        .maybeSingle();
      if (invError) throw invError;
  
      const currentAvailQty = inv?.available_qty || 0;
      const updatedAvailQty = Math.max(0, currentAvailQty + inventoryChange);
  
      await supabase
        .from('dynamic_inventory')
        .upsert(
          {
            dynamic_product_id: editing.id,
            store_id: storeId,
            available_qty: updatedAvailQty,
            quantity_sold: inv?.quantity_sold || 0,
            last_updated: new Date().toISOString(),
          },
          { onConflict: ['dynamic_product_id', 'store_id'] }
        );
      toast.success('Product updated successfully');
      await fetchProducts();

      // ... keep reset and fetch
    } catch (error) {
      console.error('Save edit error:', error);
      toast.error(`Failed to update product: ${error.message || 'Unknown error'}`);
    }
  };

  // Delete
  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await supabase.from('dynamic_product').delete().eq('id', p.id);
      await supabase
        .from('dynamic_inventory')
        .delete()
        .eq('dynamic_product_id', p.id)
        .eq('store_id', storeId);
      toast.success('Deleted');
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Failed to delete product');
    }
  };

  // Cancel add/edit
  

  const cancelEdit = () => {
    stopScanner();
    setEditing(null);
  };

  return (
    <div className="p-0 mt-4 dark:bg-gray-900 dark:text-white">
      <ToastContainer />
      <div className="flex flex-col gap-1">
        <input
          type="text"
          placeholder="Search by name, Product ID, or Size..."
          className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
       <div className="flex flex-col sm:flex-row gap-2 mb-4 px-2 sm:px-0">
 

  
   {/* ---- ADD PRODUCT ---- */}
   <button
    onClick={() => setShowAdd(true)}
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm sm:text-base hover:bg-indigo-700 transition-all"
  >
    <FaPlus className="text-sm sm:text-base" />
    <span className="hidden sm:inline">Add</span>
  </button>

  <input
  ref={fileInputRef}
  type="file"
  accept=".csv,text/csv"
  onChange={(e) => handleCSVUpload(e.target.files?.[0] ?? null)}
  className="hidden"
/>
{/* Drag & Drop Upload Zone */}
{!isUploading && (
  <div
    ref={dropZoneRef}
    onClick={() => fileInputRef.current?.click()}
    onDragOver={(e) => {
      e.preventDefault();
      dropZoneRef.current?.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900');
    }}
    onDragLeave={(e) => {
      e.preventDefault();
      dropZoneRef.current?.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900');
    }}
    onDrop={(e) => {
      e.preventDefault();
      dropZoneRef.current?.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900');
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) {
        handleCSVUpload(file);
      } else {
        toast.error('Please drop a valid CSV file');
      }
    }}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm sm:text-base hover:bg-green-700 cursor-pointer transition-all border-2 border-dashed border-green-400"
  >
    <FaFileCsv />
    <span className="hidden sm:inline">Upload CSV</span>

  </div>
  
)}
  

  {isUploading && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Uploading Products...
      </h3>
      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
        <div
          className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
        {uploadProgress}% Complete
      </p>
    </div>
  </div>
)}
 
{/* ---- DOWNLOAD TEMPLATE ---- */}
  <button
    type="button"
    onClick={downloadCSVTemplate}
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded text-sm sm:text-base hover:bg-teal-700 transition-all"
  >
    <FaDownload className="text-sm sm:text-base" />
    <span className="hidden sm:inline">Template</span>
  </button>

  <InstructionsModal
  isOpen={showInstructions}
  onClose={() => setShowInstructions(false)}
/>
  <InfoIcon onClick={() => setShowInstructions(true)} />
  
</div>


</div>
        
  
{showAdd && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-16">
    <form
      onSubmit={createProducts}
      className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4"
    >
      <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 dark:text-gray-200">
        Add Products
      </h2>


      {addForm.map((p, pi) => (
  <div
    key={pi}
    className="border border-gray-200 dark:border-gray-700 p-3 sm:p-4 rounded-lg space-y-3 dark:bg-gray-800"
  >
    {/* Remove Product Button */}
    {addForm.length > 1 && (
   <button
   type="button"
   onClick={() => removeProductForm(pi)}
   className="flex items-center gap-1 text-red-600 text-sm font-semibold mb-2"
 >
   <FaTrashAlt className="w-4 h-4" /> Remove Product
 </button>
 
    )}

    <div className="grid grid-cols-1 gap-3 sm:gap-4">

      {/* Product Name */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          Product Name
        </span>
        <input
          type="text"
          value={p.name}
          onChange={(e) => handleAddChange(pi, 'name', e.target.value)}
          placeholder="Product name"
          className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
          required
        />
      </label>

      {/* Description */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          Description
        </span>
        <textarea
          value={p.description || ''}
          onChange={(e) => handleAddChange(pi, 'description', e.target.value)}
          placeholder="Short description"
          className="w-full p-2 sm:p-3 border rounded-lg h-20 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
        ></textarea>
      </label>

      {/* Supplier Name */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          Supplier Name
        </span>
        <input
          type="text"
          value={p.suppliers_name || ''}
          onChange={(e) => handleAddChange(pi, 'suppliers_name', e.target.value)}
          placeholder="Supplier name"
          className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </label>

      {/* Purchase Price */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          Purchase Price
        </span>
        <input
          type="number"
          min="0"
          value={p.purchase_price || ''}
          onChange={(e) => handleAddChange(pi, 'purchase_price', e.target.value)}
          placeholder="Purchase price"
          className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </label>

      {/* Selling Price */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          Selling Price
        </span>
        <input
          type="number"
          min="0"
          value={p.selling_price || ''}
          onChange={(e) => handleAddChange(pi, 'selling_price', e.target.value)}
          placeholder="Selling price"
          className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </label>

      {/* Unique Toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={p.is_unique}
          onChange={(e) => handleToggleAddUnique(pi, e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm">Unique Items (e.g., phones with IMEIs)</span>
      </label>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Check for products with unique IDs (one scan per item) — uncheck for generic products tracked by quantity.
      </p>

      {/* Purchase Quantity for Non-Unique Products */}
      {!p.is_unique && (
        <label className="block">
          <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            Purchase Quantity
          </span>
          <input
            type="number"
            min="1"
            value={p.purchase_qty || ''}
            onChange={(e) => handleAddChange(pi, 'purchase_qty', e.target.value)}
            placeholder="Enter quantity"
            className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
            required
          />
        </label>
      )}

      {/* Unique IDs and Sizes */}
      <label className="block">
        <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          {p.is_unique ? "Unique IDs and Sizes" : "Generic Barcode and Size (Optional)"}
        </span>

        {p.is_unique ? (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Add unique IDs (e.g., IMEIs). Quantity auto-calculated.
            </p>

            {/* Add ID Button */}
           

            {/* List of IDs */}
            {p.deviceIds.map((id, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                <input
                  value={id}
                  onChange={(e) => handleAddId(pi, i, e.target.value)}
                  placeholder="Unique ID"
                  className={`w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 ${
                    id.trim() &&
                    p.deviceIds.some((other, j) => j !== i && other.trim().toLowerCase() === id.trim().toLowerCase())
                      ? 'border-red-500'
                      : ''
                  }`}
                />

                <input
                  value={p.deviceSizes[i] || ''}
                  onChange={(e) => handleAddSize(pi, i, e.target.value)}
                  placeholder="Size"
                  className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openScanner('add', pi, i, p.is_unique)}
                     className="p-2 sm:p-2.5 bg-white text-indigo-600"
                  >
                    <FaCamera className="w-4 h-4" />
                  </button>

                  {p.deviceIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIdField(pi, i)}
                      className="p-2 sm:p-2.5 bg-white text-red-600"
                    >
                      <FaTrashAlt/>
                    </button>
                  )}
                </div>
              </div>
            ))}

  


              </>
            ) : (
              // GENERIC PRODUCT INPUTS
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                <input
                  value={p.deviceId}
                  onChange={(e) => handleAddChange(pi, 'deviceId', e.target.value)}
                  placeholder="Generic Barcode"
                  className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  value={p.deviceSize}
                  onChange={(e) => handleAddChange(pi, 'deviceSize', e.target.value)}
                  placeholder="Size"
                  className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={() => openScanner('add', pi, 0, p.is_unique)}
                  className="p-2 sm:p-2.5 bg-white text-indigo-600"
                >
                  <FaCamera className="w-4 h-4" />
                </button>

                
              </div>
              
            )}
             {/* Add ID Button */}
             <button
              type="button"
              onClick={() => addIdField(pi)}
              className="text-indigo-600 text-sm font-semibold mb-2"
            >
              + Add ID
            </button>

              <div className="flex items-center gap-4 mt-2">
              {/* Add Product */}
              <button
                type="button"
   onClick={addAnotherProduct}
   className="text-indigo-600 text-sm font-semibold"
 >
   +  another product
 </button>

 {/* Remove Product */}

</div>

            </label>
            
          </div>
        </div>
      ))}
<button
  type="button"
  onClick={() => setShowAdd(false)}
  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
>
  Cancel
</button>

      <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm sm:text-base font-semibold">
        Save Products
      </button>
    </form>
  </div>
)}
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Desc.</th>
              <th className="px-4 py-3 whitespace-nowrap">Purchase</th>
              <th className="px-4 py-3 whitespace-nowrap">Qty</th>
              <th className="px-4 py-3 whitespace-nowrap">Selling</th>
              <th className="px-4 py-3 whitespace-nowrap">Supplier</th>
              <th className="px-4 py-3 whitespace-nowrap">Product ID</th>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
  {paginated.map((p) => {
    const isUnique = p.is_unique === true;
    const idCount = isUnique && p.deviceList ? p.deviceList.length : 0;
    const displayQty = isUnique ? idCount : (p.purchase_qty || 0);
    const displayIdLabel = isUnique
      ? `${idCount} ID(s)`
      : (p.device_id ? p.device_id : 'View');

    return (
      <tr
        key={p.id}
        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        {/* Product Name */}
        <td className="px-4 py-3 whitespace-nowrap">{p.name}</td>

        {/* Description */}
        <td className="px-4 py-3 whitespace-nowrap">{p.description}</td>

        {/* Purchase Price */}
        <td className="px-4 py-3 whitespace-nowrap">
          ₦{formatCurrency(p.purchase_price || 0)}
        </td>

        {/* Quantity */}
        <td className="px-4 py-3 whitespace-nowrap font-medium">
          {displayQty}
          {isUnique && <span className="ml-1 text-xs text-gray-500">(unique)</span>}
        </td>

        {/* Selling Price */}
        <td className="px-4 py-3 whitespace-nowrap">
          ₦{formatCurrency(p.selling_price || 0)}
        </td>

        {/* Supplier */}
        <td className="px-4 py-3 whitespace-nowrap">{p.suppliers_name}</td>

        {/* Product ID / View Details */}
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={() => setShowDetail(p)}
            className="text-indigo-600 hover:underline focus:outline-none dark:text-indigo-400 font-medium"
            title={isUnique ? `View ${idCount} unique ID(s)` : 'View product details'}
          >
            {displayIdLabel}
          </button>
        </td>

        {/* Created Date */}
        <td className="px-4 py-3 whitespace-nowrap">
          {new Date(p.created_at).toLocaleDateString()}
        </td>

        {/* Actions: Edit & Delete */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => openEdit(p)}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => deleteProduct(p)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Delete"
            >
              <FaTrashAlt />
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>

        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((cp) => cp - 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Prev
        </button>
        <span className="px-3 py-1">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((cp) => cp + 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Next
        </button>
      </div>

      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 mt-16">
          <div className="bg-white dark:bg-gray-900 p-6 rounded max-w-xl w-full max-h-[80vh] overflow-y-auto">
           
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
  {showDetail.name} - {showDetail.is_unique ? 'Unique IDs' : 'Product Details'}
</h2>
{isLoadingSoldStatus ? (
  <div className="flex justify-center py-4">
    <p className="text-gray-600 dark:text-gray-400">Loading status...</p>
  </div>
) : (
  <div>
    {showDetail.is_unique ? (
      <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
        {paginatedDevices.map((id, i) => {
          const size = showDetail.sizeList[i] || '';
          const isSold = soldDeviceIds.includes(id);
          return (
            <li key={i} className="py-2 px-1 flex items-center justify-between">
              <div className="flex items-center">
                <span>{id}{size ? ` (${size})` : ''}</span>
                {isSold && <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">SOLD</span>}
              </div>
              <button onClick={() => removeDeviceId(id)} className="text-red-600"><FaTrashAlt size={14} /></button>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="mt-4 space-y-2">
        <p className="text-gray-600 dark:text-gray-400"><strong>Barcode:</strong> {showDetail.device_id || 'None'}</p>
        <p className="text-gray-600 dark:text-gray-400"><strong>Size:</strong> {showDetail.device_size || 'None'}</p>
        <p className="text-gray-600 dark:text-gray-400"><strong>Quantity:</strong> {showDetail.purchase_qty || 0}</p>
        <p className="text-gray-600 dark:text-gray-400"><strong>Description:</strong> {showDetail.description || 'None'}</p>
        {/* Keep prices if needed */}
      </div>
    )}
    {/* Keep pagination if unique */}
    {showDetail.is_unique && totalDetailPages > 1 && (
      <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
        {/* Keep prev/next */}
      </div>
    )}
  </div>
)}
<div className="mt-4 flex justify-end">
  <button onClick={() => setShowDetail(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
    Close
  </button>
</div>



          </div>
        </div>
      )}



{editing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 mt-16">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto space-y-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white mt-6">Edit Product</h2>

      <div className="space-y-4">
        {/* === Product Information === */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Product Information
          </h3>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => handleEditChange('name', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => handleEditChange('description', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.purchase_price}
                onChange={(e) => handleEditChange('purchase_price', e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.selling_price}
                onChange={(e) => handleEditChange('selling_price', e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Unique Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_unique"
              checked={editForm.is_unique}
              onChange={(e) => handleToggleEditUnique(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="is_unique" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Unique Items (e.g., phones with IMEIs)
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {editForm.is_unique
              ? "Each ID is unique. Quantity = number of IDs."
              : "Generic barcode. Track by quantity."}
          </p>

          {/* Quantity (Only for non-unique) */}
          {!editForm.is_unique && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Restock Quantity (add to existing)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={editForm.purchase_qty || ''}
                onChange={(e) => handleEditChange('purchase_qty', e.target.value)}
                placeholder="e.g., 10 (adds 10 to current stock)"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This adds to current inventory. Leave 0 for no change.
              </p>
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              value={editForm.suppliers_name}
              onChange={(e) => handleEditChange('suppliers_name', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* === IDs and Sizes Section === */}
        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {editForm.is_unique ? 'Unique IDs & Sizes' : 'Generic Barcode & Size'}
          </h3>

          {editForm.is_unique ? (
            /* === UNIQUE: Multi-ID List === */
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Add one ID per item (e.g., IMEI). Quantity is auto-calculated.
              </p>
              {editForm.deviceIds.map((id, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-2 mt-2"
                >
                  <input
                    value={id}
                    onChange={(e) => handleDeviceIdChange(i, e.target.value)}
                    placeholder="Unique ID (e.g., IMEI)"
                    className={`w-full sm:flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      id.trim() &&
                      editForm.deviceIds.some(
                        (otherId, j) => j !== i && otherId.trim().toLowerCase() === id.trim().toLowerCase()
                      )
                        ? 'border-red-500'
                        : ''
                    }`}
                  />
                  <input
                    value={editForm.deviceSizes[i] || ''}
                    onChange={(e) => handleDeviceSizeChange(i, e.target.value)}
                    placeholder="Size (e.g., 128GB)"
                    className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openScanner('edit', 0, i, true)}
                      className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      title="Scan Unique ID"
                    >
                      <FaCamera />
                    </button>
                    {editForm.deviceIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditDeviceId(i)}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove ID"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addDeviceId}
                className="mt-2 text-indigo-600 hover:underline text-sm dark:text-indigo-400"
              >
                + Add Unique ID
              </button>
            </div>
          ) : (
            /* === NON-UNIQUE: Single Barcode === */
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-2 mt-2">
              <input
                value={editForm.deviceId}
                onChange={(e) => handleEditChange('deviceId', e.target.value)}
                placeholder="Generic Barcode (e.g., 237yrbchbedu)"
                className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                value={editForm.deviceSize}
                onChange={(e) => handleEditChange('deviceSize', e.target.value)}
                placeholder="Size (e.g., Small)"
                className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                type="button"
                onClick={() => openScanner('edit', 0, 0, false)}
                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                title="Scan Generic Barcode"
              >
                <FaCamera />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === Buttons === */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 px-2 sm:px-0">
        <button
          type="button"
          onClick={cancelEdit}
          className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveEdit}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}



 {showScanner && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-16">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-4 dark:bg-gray-900 dark:text-white">
      <h2 className="text-lg sm:text-xl font-bold text-center text-gray-900 dark:text-gray-200">
        Scan Product ID
      </h2>
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={externalScannerMode}
            onChange={() => {
              setExternalScannerMode((prev) => !prev);
              setScannerError(null);
              setScannerLoading(!externalScannerMode);
              if (manualInputRef.current) {
                manualInputRef.current.focus();
              }
            }}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
          />
          <span>Use External Barcode Scanner</span>
        </label>
        {!externalScannerMode && (
          <>
            {scannerLoading && (
              <div className="text-gray-600 dark:text-gray-400 text-center text-xs sm:text-sm">
                Initializing webcam scanner...
              </div>
            )}
            {scannerError && (
              <div className="text-red-600 dark:text-red-400 text-center text-xs sm:text-sm" aria-live="polite">
                {scannerError}
              </div>
            )}
            <div
              id="scanner"
              ref={scannerDivRef}
              className={`relative w-full h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${
                scanSuccess ? 'border-4 border-green-500' : ''
              }`}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[150px] border-2 border-red-500 bg-transparent opacity-50"></div>
              </div>
            </div>
          </>
        )}
        {externalScannerMode && (
          <div className="space-y-3">
            <div className="text-gray-600 dark:text-gray-400 text-center text-xs sm:text-sm">
              Waiting for external scanner input... Scan a barcode to proceed.
            </div>
            <label className="block">
              <span className="font-semibold block mb-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Or Enter Product ID Manually
              </span>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  ref={manualInputRef}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={handleManualInputKeyDown}
                  placeholder="Enter Product ID"
                  className="w-full p-2 sm:p-3 border rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleManualInput}
                  className="p-2 sm:p-3 bg-indigo-600 text-white rounded-full shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200 w-full sm:w-auto"
                  aria-label="Submit manual input"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </label>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              setShowScanner(false);
              setScannerTarget(null);
              setScannerError(null);
              setScannerLoading(false);
              setManualInput('');
              setExternalScannerMode(false);
              setScannerBuffer('');
              setScanSuccess(false);
            }}
            className="p-2 sm:p-3 bg-gray-500 text-white rounded-full shadow-sm hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors duration-200"
            aria-label="Close scanner"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default DynamicProducts;