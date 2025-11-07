/**
 * Shared device validation utilities
 * Extracted from DeviceDynamicSales.js to eliminate code duplication
 */

import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

/**
 * Check if a device ID has already been sold
 * @param {string} deviceId - The device ID to check
 * @param {string|number} storeId - The store ID
 * @returns {Promise<{isSold: boolean, error?: string}>}
 */
export async function checkDeviceSold(deviceId, storeId) {
  if (!deviceId || !storeId) {
    return { isSold: false, error: 'Missing device ID or store ID' };
  }

  try {
    const { data: soldData, error: soldError } = await supabase
      .from('dynamic_sales')
      .select('device_id')
      .eq('device_id', deviceId.trim())
      .eq('store_id', storeId)
      .single();

    if (soldError && soldError.code !== 'PGRST116') {
      console.error('Error checking sold status:', soldError);
      return { isSold: false, error: 'Failed to validate Product ID' };
    }

    return { isSold: !!soldData };
  } catch (err) {
    console.error('Exception checking sold status:', err);
    return { isSold: false, error: 'Failed to validate Product ID' };
  }
}

/**
 * Fetch product data by device ID
 * @param {string} deviceId - The device ID to search for
 * @param {string|number} storeId - The store ID
 * @returns {Promise<{product: object|null, error?: string}>}
 */
export async function fetchProductByDeviceId(deviceId, storeId) {
  if (!deviceId || !storeId) {
    return { product: null, error: 'Missing device ID or store ID' };
  }

  try {
    const { data: productData, error } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price, dynamic_product_imeis, device_size')
      .eq('store_id', storeId)
      .ilike('dynamic_product_imeis', `%${deviceId.trim()}%`)
      .single();

    if (error || !productData) {
      console.error('Supabase Query Error:', error);
      return { product: null, error: `Product ID "${deviceId}" not found` };
    }

    // Parse device IDs and sizes
    const deviceIds = productData.dynamic_product_imeis
      ? productData.dynamic_product_imeis.split(',').map(id => id.trim()).filter(id => id)
      : [];
    const deviceSizes = productData.device_size
      ? productData.device_size.split(',').map(size => size.trim()).filter(size => size)
      : [];

    return {
      product: {
        ...productData,
        deviceIds,
        deviceSizes,
      },
    };
  } catch (err) {
    console.error('Exception fetching product:', err);
    return { product: null, error: `Failed to fetch product for ID "${deviceId}"` };
  }
}

/**
 * Validate and process a device ID scan
 * @param {string} deviceId - The scanned device ID
 * @param {string|number} storeId - The store ID
 * @returns {Promise<{success: boolean, product?: object, error?: string}>}
 */
export async function validateAndFetchDevice(deviceId, storeId) {
  const trimmedId = deviceId?.trim();
  if (!trimmedId) {
    return { success: false, error: 'Product ID cannot be empty' };
  }

  // Check if already sold
  const soldCheck = await checkDeviceSold(trimmedId, storeId);
  if (soldCheck.error) {
    return { success: false, error: soldCheck.error };
  }
  if (soldCheck.isSold) {
    return { success: false, error: `Product ID "${trimmedId}" has already been sold` };
  }

  // Fetch product data
  const productResult = await fetchProductByDeviceId(trimmedId, storeId);
  if (productResult.error || !productResult.product) {
    return { success: false, error: productResult.error || 'Product not found' };
  }

  // Find device ID index in product's device list
  const idIndex = productResult.product.deviceIds.indexOf(trimmedId);

  return {
    success: true,
    product: productResult.product,
    deviceIdIndex: idIndex,
    deviceSize: idIndex !== -1 ? productResult.product.deviceSizes[idIndex] || '' : '',
  };
}

/**
 * Check for duplicate device IDs in lines array
 * @param {Array} lines - Array of sale lines
 * @param {string} deviceId - Device ID to check
 * @param {number} excludeLineIdx - Line index to exclude from check
 * @param {number} excludeDeviceIdx - Device index to exclude from check (optional)
 * @returns {boolean} - True if duplicate found
 */
export function hasDuplicateDeviceId(lines, deviceId, excludeLineIdx = null, excludeDeviceIdx = null) {
  const normalizedId = deviceId.trim().toLowerCase();
  return lines.some((line, lineIdx) => {
    if (excludeLineIdx !== null && lineIdx === excludeLineIdx) {
      // Check current line but exclude specific device index
      return line.deviceIds.some((id, deviceIdx) => {
        if (excludeDeviceIdx !== null && deviceIdx === excludeDeviceIdx) return false;
        return id.trim().toLowerCase() === normalizedId;
      });
    }
    return line.deviceIds.some(id => id.trim().toLowerCase() === normalizedId);
  });
}

