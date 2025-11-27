// src/components/products/utils/formatNumber.js

/**
 * Formats a number for display (commas, decimals) without adding a currency symbol.
 * @param {number|string} value The price value.
 * @returns {string} The formatted number string (e.g., "100,000.00").
 */
export const formatNumber = (value) =>
    Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });