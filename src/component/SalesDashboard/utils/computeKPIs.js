// src/components/SalesDashboard/utils/computeKPIs.js

export function computeKPIs(sales = []) {
  if (!sales.length) return {
    totalRevenue: 0,
    avgDailySales: 0,
    fastestMovingItem: null,
    slowestMovingItem: null,
    mostSoldItems: [],
    topCustomers: [],
    bestSellingHours: [],
    last30Days: [],
    productMetrics: {}
  };

  // ---------- Total Revenue ----------
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalSales, 0);

  // ---------- Average Daily Sales ----------
  const byDay = {};
  sales.forEach(s => {
    const day = s.soldAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + s.totalSales;
  });
  const avgDailySales = totalRevenue / Math.max(Object.keys(byDay).length, 1);

  // ---------- Product Totals ----------
  const productMap = {};
  sales.forEach(s => {
    if (!productMap[s.productId]) {
      productMap[s.productId] = { productName: s.productName, quantity: 0 };
    }
    productMap[s.productId].quantity += s.quantity;
  });
  const products = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
  const fastestMovingItem = products[0] || null;
  const slowestMovingItem = products[products.length - 1] || null;
  const mostSoldItems = products;

  // ---------- Top Customers ----------
  const customerMap = {};
  sales.forEach(s => {
    if (!s.customerName) return;
    if (!customerMap[s.customerName]) customerMap[s.customerName] = { customerName: s.customerName, total: 0 };
    customerMap[s.customerName].total += s.totalSales;
  });
  const topCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total);

  // ---------- Best Selling Hours ----------
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0 }));
  sales.forEach(s => {
    const h = s.soldAt.getHours();
    hours[h].total += s.totalSales;
  });

  // ---------- Last 30 Days Trend ----------
  const today = new Date();
  const last30DaysMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last30DaysMap[d.toISOString().slice(0, 10)] = 0;
  }
  sales.forEach(s => {
    const day = s.soldAt.toISOString().slice(0, 10);
    if (last30DaysMap.hasOwnProperty(day)) last30DaysMap[day] += s.totalSales;
  });
  const last30Days = Object.keys(last30DaysMap)
    .sort()
    .map(day => ({ day, total: last30DaysMap[day] }));

  // ---------- Per-Product MoM Calculations ----------
  const ymKey = d => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  // Build per-product per-month aggregation
  const productMonthMap = {};
  sales.forEach(s => {
    const pid = s.productId ?? s.dynamic_product_id ?? 'unknown';
    const name = s.productName ?? 'Unknown';
    const month = ymKey(s.soldAt);
    if (!productMonthMap[pid]) productMonthMap[pid] = { productId: pid, productName: name, months: {} };
    if (!productMonthMap[pid].months[month]) productMonthMap[pid].months[month] = { amount: 0, qty: 0 };
    productMonthMap[pid].months[month].amount += Number(s.totalSales || 0);
    productMonthMap[pid].months[month].qty += Number(s.quantity || 0);
  });

  // Compute MoM metrics for each product
  const productMetrics = {};
  Object.values(productMonthMap).forEach(pm => {
    const pid = pm.productId;
    const name = pm.productName;
    const months = pm.months || {};

    // Get sorted months (ascending)
    const monthKeys = Object.keys(months).sort();
    const currentMonthKey = monthKeys[monthKeys.length - 1] || null;
    const prevMonthKey = monthKeys[monthKeys.length - 2] || currentMonthKey;

    const currentAmount = currentMonthKey ? months[currentMonthKey].amount : 0;
    const prevAmount = prevMonthKey ? months[prevMonthKey].amount : 0;
    const currentQty = currentMonthKey ? months[currentMonthKey].qty : 0;
    const prevQty = prevMonthKey ? months[prevMonthKey].qty : 0;

    const calcPercent = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    const direction = percent => percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral';

    productMetrics[pid] = {
      productId: pid,
      productName: name,
      currentAmount,
      prevAmount,
      amountMoMPercent: Number(calcPercent(currentAmount, prevAmount).toFixed(2)),
      amountMoMDirection: direction(calcPercent(currentAmount, prevAmount)),
      currentQty,
      prevQty,
      qtyMoMPercent: Number(calcPercent(currentQty, prevQty).toFixed(2)),
      qtyMoMDirection: direction(calcPercent(currentQty, prevQty)),
      months // raw month-by-month detail
    };
  });

  return {
    totalRevenue,
    avgDailySales,
    fastestMovingItem,
    slowestMovingItem,
    mostSoldItems,
    topCustomers,
    bestSellingHours: hours,
    last30Days,
    productMetrics
  };
}
