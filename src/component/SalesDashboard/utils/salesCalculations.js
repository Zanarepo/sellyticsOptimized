// src/components/SalesDashboard/utils/salesCalculations.js
export function groupBy(array = [], keyFn) {
    return array.reduce((acc, item) => {
      const key = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }
  
  export function sum(arr = [], selector = (x) => x) {
    return arr.reduce((s, item) => s + (typeof selector === "function" ? Number(selector(item) || 0) : Number(item) || 0), 0);
  }
  