// src/components/SalesDashboard/utils/restockUtils.js
import { groupBy, sum } from "./salesCalculations";

/**
 * Normalize restock log entry:
 * difference should already be computed in DB, but ensure Number
 */
function normalizeRestock(r) {
  return {
    id: r.id,
    productId: r.dynamic_product_id ?? r.dynamicProductId ?? r.dynamic_product?.id,
    difference: Number(r.difference ?? (Number(r.new_quantity ?? 0) - Number(r.old_quantity ?? 0)) ?? 0),
    createdAt: r.created_at ? new Date(r.created_at) : null,
    reason: r.reason ?? null,
    metadata: r.metadata ?? null,
  };
}

export function computeAvgRestockPerProduct(restocks = []) {
  const normalized = restocks.map(normalizeRestock).filter(r => r.productId != null && r.difference > 0);
  const byProduct = groupBy(normalized, r => r.productId);
  const result = {};
  for (const pid of Object.keys(byProduct)) {
    const arr = byProduct[pid];
    const total = sum(arr, r => r.difference);
    result[pid] = total / arr.length;
  }
  return result; // { productId: avgRestock, ... }
}

export function getMostRestockedProducts(restocks = [], topN = 10) {
  const normalized = restocks.map(normalizeRestock).filter(r => r.productId != null);
  const byProduct = groupBy(normalized, r => r.productId);
  const arr = Object.entries(byProduct).map(([pid, list]) => {
    const totalRestocked = sum(list, r => Math.max(0, r.difference));
    return { productId: pid, totalRestocked };
  });
  arr.sort((a, b) => b.totalRestocked - a.totalRestocked);
  return arr.slice(0, topN);
}

export function getLeastRestockedProducts(restocks = [], topN = 10) {
  // only consider products that have at least one positive restock
  const most = getMostRestockedProducts(restocks, 999999);
  const filtered = most.filter(x => x.totalRestocked > 0);
  filtered.sort((a, b) => a.totalRestocked - b.totalRestocked);
  return filtered.slice(0, topN);
}
