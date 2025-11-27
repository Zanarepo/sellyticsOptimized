import React from "react";
import SalesForm from "../DynamicSales/components/SalesForm";
import { useCurrency } from "../DynamicSales/components/CurrencyContext";

export default function AddSaleModal({
  show = true,
  onCancel,
  onSubmit,
  initialLines,
  products,
  inventory,
  openScanner,
  availableDeviceIds,
  addDeviceId,
  removeDeviceId,
  handleLineChange,
  paymentMethod,
  setPaymentMethod,
  totalAmount,
  selectedCustomerId,
  onCustomerChange,       // ✅ Accept from parent
  emailReceipt,
  setEmailReceipt,
  storeId
}) {
  const { formatCurrency } = useCurrency();
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center sm:items-start justify-center p-4 z-50 overflow-auto mt-0 sm:mt-16">
      <SalesForm
        type="add"
        onSubmit={onSubmit}
        onCancel={onCancel}
        lines={initialLines}
        setLines={() => {}}
        removeLine={() => {}}
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

        // ✅ Correct usage — forward the callback from parent
        onCustomerChange={onCustomerChange}

        totalAmount={totalAmount}
        emailReceipt={emailReceipt}
        setEmailReceipt={setEmailReceipt}
      />
    </div>
  );
}
