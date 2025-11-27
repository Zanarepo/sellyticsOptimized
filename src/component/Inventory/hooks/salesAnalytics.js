// inventory/utils/salesAnalytics.js

/**
 * Calculate total revenue for a set of sales
 * @param {Array} sales - array of sales objects
 * @returns {number} total revenue
 */
export function getTotalRevenue(sales) {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.amount || 0), 0);
  }
  
  /**
   * Calculate total units sold
   * @param {Array} sales - array of sales objects
   * @returns {number} total quantity sold
   */
  export function getTotalUnitsSold(sales) {
    return sales.reduce((sum, sale) => sum + parseInt(sale.quantity || 0, 10), 0);
  }
  
  /**
   * Aggregate daily sales (for bar chart)
   * @param {Array} sales - array of sales objects
   * @returns {Object} { 'YYYY-MM-DD': totalAmount }
   */
  export function getDailySalesSummary(sales) {
    return sales.reduce((acc, sale) => {
      const date = new Date(sale.sold_at).toISOString().split('T')[0]; // YYYY-MM-DD
      acc[date] = (acc[date] || 0) + parseFloat(sale.amount || 0);
      return acc;
    }, {});
  }
  
  /**
   * Calculate average daily sales over a given period
   * @param {Array} sales - array of sales objects
   * @param {number} days - number of days to average over
   * @returns {number} average daily sales
   */
  export function getAverageDailySales(sales, days = 30) {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
  
    const recentSales = sales.filter(
      (sale) => new Date(sale.sold_at) >= startDate
    );
  
    const totalUnits = getTotalUnitsSold(recentSales);
    return days > 0 ? Math.round(totalUnits / days) : 0;
  }
  
  /**
   * Calculate best-selling hours
   * @param {Array} sales - array of sales objects
   * @returns {Object} { hour: totalSalesAmount }
   */
  export function getBestHours(sales) {
    return sales.reduce((acc, sale) => {
      const hour = new Date(sale.sold_at).getHours();
      acc[hour] = (acc[hour] || 0) + parseFloat(sale.amount || 0);
      return acc;
    }, {});
  }
  