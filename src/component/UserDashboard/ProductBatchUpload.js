// src/utils/uploadProductsFromCSV.js
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

// Global abort flag (reset on each upload)
let abortUpload = false;

export const cancelUpload = () => {
  abortUpload = true;
};

/**
 * Upload products from CSV with progress, skip existing, and cancel support
 * @param {string} csvText - Raw CSV content
 * @param {string} storeId - Current store ID
 * @param {Function} onSuccess - Called on successful insert
 * @param {Function} onProgress - (progress: number) => void  // 0 to 100
 * @param {Function} onFinalMessage - (msg: string) => void  // Final status
 */
export const uploadProductsFromCSV = async (
  csvText,
  storeId,
  onSuccess,
  onProgress = () => {},
  onFinalMessage = () => {}
) => {
  abortUpload = false; // Reset for new upload

  if (!storeId) {
    toast.error('Store ID not found. Please log in again.');
    onFinalMessage('Store ID missing.');
    return;
  }

  if (!csvText.trim()) {
    toast.error('CSV file is empty.');
    onFinalMessage('Empty CSV file.');
    return;
  }

  try {
    // Parse CSV
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('CSV has no lines.');
      onFinalMessage('Invalid CSV format.');
      return;
    }

    const headers = lines[0]
      .split(',')
      .map(h => h.trim().toLowerCase().replace(/"/g, ''));

    const requiredCols = ['name'];
    const missing = requiredCols.filter(c => !headers.includes(c));
    if (missing.length > 0) {
      toast.error(`Missing required column(s): ${missing.join(', ')}`);
      onFinalMessage(`Missing columns: ${missing.join(', ')}`);
      return;
    }

    const rows = lines.slice(1);
    if (rows.length === 0) {
      toast.error('No data rows found in CSV.');
      onFinalMessage('No product data found.');
      return;
    }

    // Fetch existing product names
    const { data: existingProducts, error: nameErr } = await supabase
      .from('dynamic_product')
      .select('name')
      .eq('store_id', storeId);

    if (nameErr) throw nameErr;

    const existingNames = new Set(
      existingProducts.map(p => p.name.trim().toLowerCase())
    );

    const productsToInsert = [];
    const inventoryUpdates = [];
    const allNewDeviceIds = new Set();
    const skippedProducts = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      if (abortUpload) {
        onFinalMessage('Upload cancelled by user.');
        return;
      }

      const row = rows[i];
      const values = row
        .split(',')
        .map(v => v.trim().replace(/^"|"$/g, ''));

      if (values.length < headers.length) {
        toast.warn(`Row ${i + 2}: Incomplete data, skipping.`);
        onProgress(((i + 1) / rows.length) * 100);
        continue;
      }

      const product = {};
      headers.forEach((h, idx) => {
        product[h] = values[idx] || '';
      });

      const name = product.name.trim();
      if (!name) {
        toast.warn(`Row ${i + 2}: Product name is required, skipping.`);
        onProgress(((i + 1) / rows.length) * 100);
        continue;
      }

      // Skip if product already exists
      if (existingNames.has(name.toLowerCase())) {
        skippedProducts.push(name);
        onProgress(((i + 1) / rows.length) * 100);
        continue;
      }

      // Parse device IDs and sizes
      let deviceIdList = [];
      let deviceSizeList = [];

      if (product.device_ids?.trim()) {
        deviceIdList = product.device_ids
          .split(';')
          .map(id => id.trim())
          .filter(id => id);

        deviceSizeList = (product.device_sizes || '')
          .split(';')
          .map(s => s.trim())
          .filter(s => s);

        // Align sizes
        while (deviceSizeList.length < deviceIdList.length) deviceSizeList.push('');
        deviceSizeList = deviceSizeList.slice(0, deviceIdList.length);
      }

      const hasDeviceIds = deviceIdList.length > 0;
      const purchaseQty = hasDeviceIds ? 0 : (parseInt(product.purchase_qty) || 0);

      if (!hasDeviceIds && purchaseQty <= 0) {
        toast.warn(`Row ${i + 2}: Must have Device IDs or Purchase Quantity.`);
        onProgress(((i + 1) / rows.length) * 100);
        continue;
      }

      // Check duplicate IDs within row
      const lowerIds = deviceIdList.map(id => id.toLowerCase());
      const dupInRow = lowerIds.filter((id, idx) => lowerIds.indexOf(id) !== idx);
      if (dupInRow.length > 0) {
        toast.warn(`Row ${i + 2}: Duplicate Device ID(s): ${[...new Set(dupInRow)].join(', ')}`);
        onProgress(((i + 1) / rows.length) * 100);
        continue;
      }

      // Track new device IDs for global check
      deviceIdList.forEach(id => allNewDeviceIds.add(id.toLowerCase()));

      // Add to insert list
      productsToInsert.push({
        store_id: storeId,
        name,
        description: product.description?.trim() || null,
        purchase_price: parseFloat(product.purchase_price) || 0,
        selling_price: parseFloat(product.selling_price) || 0,
        suppliers_name: product.suppliers_name?.trim() || null,
        purchase_qty: hasDeviceIds ? deviceIdList.length : purchaseQty,
        dynamic_product_imeis: hasDeviceIds ? deviceIdList.join(',') : null,
        device_size: hasDeviceIds ? deviceSizeList.join(',') : null,
      });

      onProgress(((i + 1) / rows.length) * 100);
    }

    if (abortUpload) {
      onFinalMessage('Upload cancelled.');
      return;
    }

    if (productsToInsert.length === 0) {
      const msg = skippedProducts.length
        ? `All ${skippedProducts.length} product(s) already exist: ${skippedProducts.slice(0, 3).join(', ')}${skippedProducts.length > 3 ? '...' : ''}`
        : 'No new products to upload.';
      toast.info(msg);
      onFinalMessage(msg);
      return;
    }

    // Global device ID conflict check
    const allNewIds = Array.from(allNewDeviceIds);
    if (allNewIds.length > 0) {
      const { data: existing, error: fetchErr } = await supabase
        .from('dynamic_product')
        .select('dynamic_product_imeis')
        .eq('store_id', storeId);

      if (fetchErr) throw fetchErr;

      const existingIds = existing
        .flatMap(p => p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').map(id => id.trim().toLowerCase()) : [])
        .filter(Boolean);

      const conflicts = allNewIds.filter(id => existingIds.includes(id));
      if (conflicts.length > 0) {
        const msg = `Device ID(s) already in use: ${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? '...' : ''}`;
        toast.error(msg);
        onFinalMessage(msg);
        return;
      }
    }

    // Insert products
    const { data: inserted, error: insertErr } = await supabase
      .from('dynamic_product')
      .insert(productsToInsert)
      .select('id, dynamic_product_imeis, purchase_qty');

    if (insertErr) throw insertErr;

    // Update inventory
    inventoryUpdates.push(
      ...inserted.map(p => {
        const deviceCount = p.dynamic_product_imeis
          ? p.dynamic_product_imeis.split(',').filter(id => id.trim()).length
          : 0;
        const qty = deviceCount > 0 ? deviceCount : (p.purchase_qty || 0);
        return {
          dynamic_product_id: p.id,
          store_id: storeId,
          available_qty: qty,
          quantity_sold: 0,
          last_updated: new Date().toISOString(),
        };
      })
    );

    await supabase
      .from('dynamic_inventory')
      .upsert(inventoryUpdates, { onConflict: ['dynamic_product_id', 'store_id'] });

    // Final success message
    const skippedMsg = skippedProducts.length
      ? ` (${skippedProducts.length} skipped: already exist)`
      : '';

    const finalMsg = `Uploaded ${inserted.length} product(s)!${skippedMsg}`;
    toast.success(
      <div>
        <strong>{finalMsg}</strong>
        {skippedProducts.length > 0 && (
          <p className="text-xs mt-1">
            Skipped: {skippedProducts.slice(0, 3).join(', ')}{skippedProducts.length > 3 ? '...' : ''}
          </p>
        )}
      </div>,
      { autoClose: 6000 }
    );

    onFinalMessage(finalMsg);
    if (onSuccess) onSuccess();

  } catch (error) {
    if (abortUpload) {
      onFinalMessage('Upload cancelled.');
    } else {
      console.error('CSV Upload Error:', error);
      const msg = `Upload failed: ${error.message || 'Unknown error'}`;
      toast.error(msg);
      onFinalMessage(msg);
    }
  }
};