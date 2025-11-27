// src/components/products/utils/formatCurrency.js
export const formatCurrency = (value) =>
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });