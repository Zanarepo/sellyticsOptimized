// src/inventory/utils/forecastUtils.js

/**
 * Computes expected days until stock out
 */
export function computeDaysUntilStockOut(currentQty, dailyAvg) {
  if (!dailyAvg || dailyAvg <= 0) return Infinity;
  return Math.round(currentQty / dailyAvg);
}

/**
 * Human readable forecast
 */
export function formatForecast(days) {
  if (days === Infinity) return "No stock-out risk";
  if (days < 1) return "Less than a day";
  return `${days} days left`;
}
