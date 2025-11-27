import { useState, useMemo } from 'react';

/**
 * Hook to search/filter inventory by product name
 * @param {array} inventory - inventory array from useInventory
 * @returns {object} { searchTerm, setSearchTerm, filteredInventory }
 */
export default function useInventorySearch(inventory = []) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const term = searchTerm.toLowerCase();
    return inventory.filter(
      (item) => (item.dynamic_product?.name || '').toLowerCase().includes(term)
    );
  }, [inventory, searchTerm]);

  return { searchTerm, setSearchTerm, filteredInventory };
}
