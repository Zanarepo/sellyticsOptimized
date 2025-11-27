// src/inventory/utils/salesUtils.js

/**
 * Groups sales data by day
 */
export function groupSalesByDay(sales) {
    const grouped = {};
  
    sales.forEach((s) => {
      const day = s.sold_at.split("T")[0];
      if (!grouped[day]) grouped[day] = { day, qty: 0, amount: 0 };
      grouped[day].qty += s.quantity;
      grouped[day].amount += Number(s.amount);
    });
  
    return Object.values(grouped);
  }
  
  /**
   * Calculates daily averages for the last X days
   */
  export function calculateDailyAverage(sales, days = 30) {
    const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    return totalQty / days;
  }
  