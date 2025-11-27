import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import { useProducts } from './useProducts';
import ProductTable from './ProductTable';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import DetailModal from './DetailModal';           // ← Already imported
import CSVUploader from './CSVUploader';
import InstructionsModal from '../UserDashboard/InstructionsModal';
import InfoIcon from '../UserDashboard/InfoIcon';

export default function DynamicProducts({ overrideStoreId }) {
  const storeId = overrideStoreId || localStorage.getItem('store_id');
  const {
    filtered,
    search,
    setSearch,
    createProducts,
    updateProduct,
    deleteProduct,
    //checkSoldDevices,
    formatCurrency,
    fetchProducts,
  } = useProducts(storeId);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);  // ← Changed
  const [showInst, setShowInst] = useState(false);

  const refresh = () => fetchProducts();

  return (
    <div className="p-4 dark:bg-gray-900 dark:text-white">
      <ToastContainer />
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name / ID / size"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 border rounded dark:bg-gray-800"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded">
            <FaPlus /> Add
          </button>
          <CSVUploader storeId={storeId} onRefresh={refresh} />
          <InfoIcon onClick={() => setShowInst(true)} />
        </div>
      </div>

      <ProductTable
        filtered={filtered}
        onEdit={p => setEditing(p)}
        onDelete={async p => { if (window.confirm(`Delete ${p.name}?`)) await deleteProduct(p.id); }}
        onDetail={setSelectedProduct}   // ← Changed here
        formatCurrency={formatCurrency}
        storeId={storeId}
      />

      {showAdd && (
        <AddProductModal
          storeId={storeId}
          onSave={createProducts}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <EditProductModal
          product={editing}
          storeId={storeId}
          onSave={updateProduct}
          onClose={() => setEditing(null)}
        />
      )}

      {/* BEAUTIFUL NEW DETAIL MODAL */}
      {selectedProduct && (
        <DetailModal
          product={selectedProduct}
          storeId={storeId}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <InstructionsModal isOpen={showInst} onClose={() => setShowInst(false)} />
    </div>
  );
}