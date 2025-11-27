import { useMemo } from 'react';
import { getPreferences } from '../utils/inventoryPreferences';

/**
 * Hook to filter and sort low stock items
 * @param {array} inventory - inventory array from useInventory
 * @param {number} [customThreshold] - optional override for low stock threshold
 * @param {string} [sortBy] - 'quantity' | 'name'
 * @returns {array} filtered and sorted low stock items
 */
export default function useLowStock(inventory = [], customThreshold, sortBy) {
  const preferences = getPreferences();

  const threshold = customThreshold ?? preferences.lowStockThreshold;
  const sortField = sortBy ?? preferences.sortBy;

  const lowStockItems = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];

    const filtered = inventory.filter(
      (item) => item.available_qty <= threshold
    );

    return filtered.sort((a, b) => {
      if (sortField === 'quantity') {
        return a.available_qty - b.available_qty;
      } else if (sortField === 'name') {
        return (a.dynamic_product?.name || '')
          .toLowerCase()
          .localeCompare((b.dynamic_product?.name || '').toLowerCase());
      }
      return 0;
    });
  }, [inventory, threshold, sortField]);

  return lowStockItems;
}
