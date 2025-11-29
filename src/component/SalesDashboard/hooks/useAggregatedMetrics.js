// src/components/SalesDashboard/hooks/useAggregatedMetrics.js
import { useMemo } from "react";
import { groupBy, sum } from "../utils/salesCalculations";

export default function useAggregatedMetrics(sales = []) {
  return useMemo(() => {
    if (!sales.length) {
      return {
        totalRevenue: 0,
        avgDailySales: 0,
        fastestMovingItem: null,
        slowestMovingItem: null,
        mostSoldItems: [],
        topCustomers: [],
        bestSellingHours: [],
        last30Days: [],
        topRevenueItems: [],
      };
    }

    // --- Total revenue ---
    const totalRevenue = sum(sales, (s) => s.totalSales);

    // --- Avg daily sales ---
    const salesByDay = groupBy(sales, (s) => s.soldAt.toISOString().slice(0, 10));
    const avgDailySales =
      Object.values(salesByDay).reduce(
        (acc, daySales) => acc + sum(daySales, (s) => s.totalSales),
        0
      ) / Math.max(Object.keys(salesByDay).length, 1);

    // --- Products sold ---
    const productsMap = {};
    sales.forEach((s) => {
      if (!productsMap[s.productId]) {
        productsMap[s.productId] = {
          productId: s.productId,
          productName: s.productName,
          quantity: 0,
          totalSales: 0,
        };
      }
      productsMap[s.productId].quantity += s.quantity;
      productsMap[s.productId].totalSales += s.totalSales;
    });
    const productList = Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);
    const fastestMovingItem = productList[0] || null;
    const slowestMovingItem = productList[productList.length - 1] || null;
    const mostSoldItems = productList;

    // --- Top customers ---
    const customersMap = {};
    sales.forEach((s) => {
      const key = s.customerId ?? s.customerName ?? "anonymous";
      if (!customersMap[key])
        customersMap[key] = { customerId: s.customerId, customerName: s.customerName, total: 0 };
      customersMap[key].total += s.totalSales;
    });
    const topCustomers = Object.values(customersMap).sort((a, b) => b.total - a.total);

    // --- Best selling hours ---
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0 }));
    sales.forEach((s) => {
      const h = s.soldAt.getHours();
      hours[h].total += s.totalSales;
    });

    // --- Last 30 days trend ---
    const last30DaysMap = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last30DaysMap[d.toISOString().slice(0, 10)] = 0;
    }
    sales.forEach((s) => {
      const day = s.soldAt.toISOString().slice(0, 10);
      if (last30DaysMap.hasOwnProperty(day)) last30DaysMap[day] += s.totalSales;
    });
    const last30Days = Object.keys(last30DaysMap)
      .sort()
      .map((day) => ({ day, total: last30DaysMap[day] }));

    // --- Top 3 items by revenue ---
    const topRevenueItems = Object.values(productsMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 3);

    return {
      totalRevenue,
      avgDailySales,
      fastestMovingItem,
      slowestMovingItem,
      mostSoldItems,
      topCustomers,
      bestSellingHours: hours,
      last30Days,
      topRevenueItems,
    };
  }, [sales]);
}
