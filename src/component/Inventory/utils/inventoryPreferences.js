// src/inventory/utils/inventoryPreferences.js

const STORAGE_KEY = 'inventory_preferences';

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES = {
  lowStockThreshold: 5,
  pageSize: 10,
  sortBy: 'quantity', // 'quantity' | 'name'
  columnsVisible: ['id', 'dynamic_product', 'available_qty', 'quantity_sold'],
};

/**
 * Get user preferences
 * @returns {object}
 */
export function getPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch (err) {
    console.error('Error reading inventory preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences
 * @param {object} prefs
 */
export function savePreferences(prefs = {}) {
  try {
    const current = getPreferences();
    const merged = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error saving inventory preferences:', err);
  }
}

/**
 * Reset preferences to default
 */
export function resetPreferences() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  } catch (err) {
    console.error('Error resetting inventory preferences:', err);
  }
}
