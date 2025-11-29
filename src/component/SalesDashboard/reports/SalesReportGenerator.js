import { format } from "date-fns";

export default function SalesReportGenerator({ salesData, currencyFormatter }) {
  if (!salesData) return null;

  // Prepare structured report
  const report = {
    generatedAt: new Date(),
    totalRevenue: salesData.reduce((sum, s) => sum + s.totalSales, 0),
    totalQuantity: salesData.reduce((sum, s) => sum + s.quantity, 0),
    salesCount: salesData.length,
    products: {},
    customers: {},
    bestSellingHours: {},
    last30Days: [],
  };

  salesData.forEach((sale) => {
    // Products
    if (!report.products[sale.productName]) {
      report.products[sale.productName] = { quantity: 0, totalSales: 0 };
    }
    report.products[sale.productName].quantity += sale.quantity;
    report.products[sale.productName].totalSales += sale.totalSales;

    // Customers
    if (sale.customerName) {
      if (!report.customers[sale.customerName]) report.customers[sale.customerName] = 0;
      report.customers[sale.customerName] += sale.totalSales;
    }

    // Best selling hours
    const hour = new Date(sale.soldAt).getHours();
    if (!report.bestSellingHours[hour]) report.bestSellingHours[hour] = 0;
    report.bestSellingHours[hour] += sale.quantity;

    // Last 30 days graph
    const daysAgo = Math.floor((new Date() - new Date(sale.soldAt)) / (1000 * 60 * 60 * 24));
    if (daysAgo < 30) {
      report.last30Days[29 - daysAgo] = (report.last30Days[29 - daysAgo] || 0) + sale.totalSales;
    }
  });

  // Compute top/slowest movers
  const sortedProducts = Object.entries(report.products)
    .sort((a, b) => b[1].quantity - a[1].quantity);

  report.mostSoldItem = sortedProducts[0];
  report.fastestMovingItem = sortedProducts[0];
  report.slowestMovingItem = sortedProducts[sortedProducts.length - 1];

  // Top customer
  const sortedCustomers = Object.entries(report.customers)
    .sort((a, b) => b[1] - a[1]);
  report.topCustomer = sortedCustomers[0];

  // Format totals with currency
  report.totalRevenueFormatted = currencyFormatter(report.totalRevenue);

  return report;
}
