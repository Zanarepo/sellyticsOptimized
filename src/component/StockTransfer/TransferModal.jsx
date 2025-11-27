// src/components/stockTransfer/TransferModal.jsx
import { toast } from "react-toastify";
import { supabase } from "../../supabaseClient";

export default function TransferModal({
  open,
  onClose,
  product,
  stores,
  sourceStoreId,
  destination,
  setDestination,
  qty,
  setQty,
  onSuccess,
  userId,
  ownerId,
}) {
  if (!open || !product) return null;

  const submit = async () => {
    const quantity = Number(qty);

    // Validation
    if (!destination) {
      toast.error("Please select a destination store");
      return;
    }
    if (quantity <= 0 || quantity > product.available_qty) {
      toast.error("Invalid quantity or not enough stock");
      return;
    }
    if (String(destination) === String(sourceStoreId)) {
      toast.error("You cannot transfer to the same store!");
      return;
    }

    try {
      // 1. Deduct from source inventory
      const { error: deductError } = await supabase
        .from("dynamic_inventory")
        .update({
          available_qty: product.available_qty - quantity,
          quantity: product.available_qty - quantity,
          updated_at: new Date(),
        })
        .eq("store_id", sourceStoreId)
        .eq("dynamic_product_id", product.dynamic_product_id);

      if (deductError) throw deductError;

      const productName = product.dynamic_product?.name || product.name;

      // 2. Find product in destination
      const { data: destProduct } = await supabase
        .from("dynamic_product")
        .select("id")
        .eq("store_id", destination)
        .eq("name", productName)
        .maybeSingle();

      if (destProduct) {
        // Product exists → ADD to existing inventory (THIS IS THE CORRECT WAY)
        const { error } = await supabase
          .from("dynamic_inventory")
          .update({
            available_qty: () => `available_qty + ${quantity}`,
            quantity: () => `quantity + ${quantity}`,
            updated_at: new Date(),
          })
          .eq("store_id", destination)
          .eq("dynamic_product_id", destProduct.id);

        if (error) throw error;
      } else {
        // Product doesn't exist → create it (your original trigger creates inventory)
        const { error } = await supabase
          .from("dynamic_product")
          .insert({
            store_id: destination,
            name: productName,
            purchase_qty: quantity,
            owner_id: ownerId,
            created_by_user_id: userId,
            description: product.dynamic_product?.description ?? null,
            purchase_price: product.dynamic_product?.purchase_price ?? null,
            markup_percent: product.dynamic_product?.markup_percent ?? null,
            selling_price: product.dynamic_product?.selling_price ?? null,
            suppliers_name: product.dynamic_product?.suppliers_name ?? null,
            device_id: product.dynamic_product?.device_id ?? null,
            dynamic_product_imeis: product.dynamic_product?.dynamic_product_imeis ?? null,
            device_size: product.dynamic_product?.device_size ?? null,
          });

        if (error) throw error;
      }

      toast.success(`Transferred ${quantity} × ${productName}`);
      onSuccess?.();
      onClose();
      setQty("");
      setDestination("");
    } catch (err) {
      console.error("Transfer failed:", err);
      toast.error(err.message || "Transfer failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
  
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Transfer Stock
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
            ✕
          </button>
        </div>
  
        <div className="p-6 space-y-6 text-sm">
  
          {/* Product & Source Store */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800">
            
            <div className="flex items-center gap-3">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Product</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {product.dynamic_product?.name || "Unknown"}
                </p>
              </div>
            </div>
  
            <div className="flex items-center gap-3">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">From Store</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {stores.find(s => String(s.id) === String(sourceStoreId))?.shop_name || "Unknown Store"}
                </p>
              </div>
            </div>
          </div>
  
          {/* Transfer Form */}
          <div className="space-y-4 pt-4 border-t dark:border-gray-700">
  
            {/* Destination Store */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                To Store
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:bg-gray-900 transition"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Select destination</option>
                {stores
                  .filter(s => String(s.id) !== String(sourceStoreId))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.shop_name}</option>
                  ))}
              </select>
            </div>
  
            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Quantity (Available: {product.available_qty})
              </label>
              <input
                type="number"
                min="1"
                max={product.available_qty}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-500 dark:bg-gray-900 transition"
                placeholder="Enter quantity"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
  
          </div>
        </div>
  
        {/* Footer */}
        <div className="p-4 border-t sticky bottom-0 bg-white dark:bg-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-bold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
  
          <button
            onClick={submit}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-indigo-800 shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer Now
          </button>
        </div>
  
      </div>
    </div>
  );
}  