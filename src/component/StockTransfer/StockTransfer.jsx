// src/components/stockTransfer/StockTransfer.jsx
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useStockTransfer } from "./useStockTransfer";
import StoreSelector from "./StoreSelector";
import SearchBar from "./SearchBar";
import InventoryTable from "./InventoryTable";
import TransferHistoryTable from "./TransferHistoryTable";
import TransferModal from "./TransferModal";
import TransferDetailsModal from "./TransferDetailsModal";

export default function StockTransfer() {
  const {
    stores,
    selectedStore,
    inventory,

    currentEntries,
    totalPages,
    currentPage,
    loading,
    loadingUser,
    isStoreOwner,
    searchQuery,
    setSearchQuery,
    handleStoreChange,
    paginate,
    refreshData,
    userId,
    ownerIdState,
  } = useStockTransfer();

  const [showInv, setShowInv] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [destStore, setDestStore] = useState("");
  const [qty, setQty] = useState("");

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-center text-white bg-gradient-to-r from-indigo-500 to-indigo-700 py-4 rounded-lg mb-8">
        Stock Transfer
      </h2>

      {!isStoreOwner && !loadingUser && (
        <p className="text-center text-red-600 text-xl">Only store owners can use this page.</p>
      )}

      {isStoreOwner && stores.length === 0 && !loading && (
        <p className="text-center text-gray-600">No stores found.</p>
      )}

      {isStoreOwner && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg mb-8">
            <StoreSelector stores={stores} value={selectedStore} onChange={handleStoreChange} disabled={loading || loadingUser} />
            <SearchBar value={searchQuery} onChange={setSearchQuery} disabled={!selectedStore} />
          </div>

          <InventoryTable
            inventory={inventory}
            loading={loading}
            show={showInv}
            toggleShow={() => setShowInv(!showInv)}
            onTransfer={p => {
              setSelectedProduct(p);
              setModalOpen(true);
            }}
          />

          <TransferHistoryTable
            entries={currentEntries}
            totalPages={totalPages}
            currentPage={currentPage}
            paginate={paginate}
            loading={loading}
            show={showHist}
            toggleShow={() => setShowHist(!showHist)}
            onViewDetails={t => {
              setSelectedTransfer(t);
              setDetailsOpen(true);
            }}
          />
        </>
      )}

      <TransferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        stores={stores}
        sourceStoreId={selectedStore}
        destination={destStore}
        setDestination={setDestStore}
        qty={qty}
        setQty={setQty}
        onSuccess={refreshData}
        userId={userId}
        ownerId={ownerIdState}
      />

      <TransferDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        transfer={selectedTransfer}
      />

      {(loading || loadingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}