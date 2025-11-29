// src/components/SalesDashboard/utils/aggregateSales.js
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";

/**
 * Aggregates sales data by day, week, and month
 * @param {Array} salesData - Array of sales objects { productId, soldAt, quantity, totalSales }
 * @returns {Object} - Aggregated sales:
 * {
 *   daily: { '2025-11-29': { qty: X, amount: Y, products: { ... } } },
 *   weekly: { '2025-W48': { qty: X, amount: Y, products: { ... } } },
 *   monthly: { '2025-11': { qty: X, amount: Y, products: { ... } } },
 *   byProduct: { productId: { daily: {...}, weekly: {...}, monthly: {...} } }
 * }
 */
export function aggregateSales(salesData = []) {
  const daily = {};
  const weekly = {};
  const monthly = {};
  const byProduct = {};

  salesData.forEach((sale) => {
    const date = new Date(sale.soldAt);
    const dayKey = format(startOfDay(date), "yyyy-MM-dd");
    const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-'W'II");
    const monthKey = format(startOfMonth(date), "yyyy-MM");

    // --- Daily aggregation ---
    if (!daily[dayKey]) daily[dayKey] = { qty: 0, amount: 0 };
    daily[dayKey].qty += sale.quantity;
    daily[dayKey].amount += sale.totalSales;

    // --- Weekly aggregation ---
    if (!weekly[weekKey]) weekly[weekKey] = { qty: 0, amount: 0 };
    weekly[weekKey].qty += sale.quantity;
    weekly[weekKey].amount += sale.totalSales;

    // --- Monthly aggregation ---
    if (!monthly[monthKey]) monthly[monthKey] = { qty: 0, amount: 0 };
    monthly[monthKey].qty += sale.quantity;
    monthly[monthKey].amount += sale.totalSales;

    // --- By product ---
    if (!byProduct[sale.productId]) byProduct[sale.productId] = { daily: {}, weekly: {}, monthly: {} };

    // By product daily
    if (!byProduct[sale.productId].daily[dayKey])
      byProduct[sale.productId].daily[dayKey] = { qty: 0, amount: 0 };
    byProduct[sale.productId].daily[dayKey].qty += sale.quantity;
    byProduct[sale.productId].daily[dayKey].amount += sale.totalSales;

    // By product weekly
    if (!byProduct[sale.productId].weekly[weekKey])
      byProduct[sale.productId].weekly[weekKey] = { qty: 0, amount: 0 };
    byProduct[sale.productId].weekly[weekKey].qty += sale.quantity;
    byProduct[sale.productId].weekly[weekKey].amount += sale.totalSales;

    // By product monthly
    if (!byProduct[sale.productId].monthly[monthKey])
      byProduct[sale.productId].monthly[monthKey] = { qty: 0, amount: 0 };
    byProduct[sale.productId].monthly[monthKey].qty += sale.quantity;
    byProduct[sale.productId].monthly[monthKey].amount += sale.totalSales;
  });

  return { daily, weekly, monthly, byProduct };
}
