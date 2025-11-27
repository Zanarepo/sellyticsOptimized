// src/inventory/utils/customerUtils.js

/**
 * Aggregates customers by sales value and qty
 */
export function groupCustomers(sales) {
  const map = {};

  sales.forEach((sale) => {
    const key = sale.customer_id || sale.customer_name || "Unknown";

    if (!map[key]) {
      map[key] = {
        customer_id: sale.customer_id,
        customer_name: sale.customer_name,
        created_by_user_id: sale.created_by_user_id,
        total_amount: 0,
        total_qty: 0,
      };
    }

    map[key].total_amount += Number(sale.amount);
    map[key].total_qty += sale.quantity;
  });

  return Object.values(map).sort((a, b) => b.total_amount - a.total_amount);
}

/**
 * Format customer records for UI
 */
export function formatCustomer(customer) {
  return {
    name: customer.customer_name || "N/A",
    amount: customer.total_amount,
    qty: customer.total_qty,
    created_by: customer.created_by_user_id,
  };
}
