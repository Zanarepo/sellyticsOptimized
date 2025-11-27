import { useRef, useState } from 'react';
import { FaFileCsv, FaDownload } from 'react-icons/fa';
import { uploadProductsFromCSV } from '../UserDashboard/ProductBatchUpload';
import { toastSuccess, toastError } from './toastError';

export default function CSVUploader({ storeId, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  const downloadTemplate = () => {
    const csv = `name,description,purchase_price,selling_price,suppliers_name,device_ids,device_sizes,purchase_qty
iPhone 14,Black 128GB,450000,650000,Apple Store,IMEI123;IMEI124,128GB;128GB,
Samsung Watch,Smartwatch,80000,120000,TechHub,WATCH001;WATCH002,Black;Silver,
Rice 50kg,Parboiled Rice,25000,35000,FoodMart,,,100
Cement,Bag of Cement,5000,7000,BuildCo,,,200`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    toastSuccess('Template downloaded');
  };

  const startUpload = async (file) => {
    if (!file?.name.endsWith('.csv')) return toastError('Only CSV files allowed');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      try {
        await uploadProductsFromCSV(
          text,
          storeId,
          onRefresh,
          (p) => setProgress(Math.round(p)),
          () => {
            setUploading(false);
            setProgress(0);
          }
        );
      } catch (err) {
        toastError(err.message ?? 'Upload failed');
        setUploading(false);
        setProgress(0);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => startUpload(e.target.files?.[0])} />
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <FaFileCsv /> Upload CSV
        </button>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          <FaDownload /> Template
        </button>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded w-80">
            <p className="mb-2">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div className="bg-indigo-600 h-2 rounded" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}