// src/inventory/utils/restockUtils.js

/**
 * Calculates total restocked units
 */
export function getTotalRestocked(restocks) {
  return restocks.reduce((sum, r) => sum + (r.difference || 0), 0);
}

/**
 * Formats restock logs with clear labels
 */
export function formatRestockHistory(restocks) {
  return restocks.map((r) => ({
    id: r.id,
    addedQty: r.difference,
    reason: r.reason || "No reason provided",
    timestamp: r.created_at,
  }));
}
