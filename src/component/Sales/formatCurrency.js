// src/component/Sales/formatCurrency.js
export const formatCurrency = (value, currency) => {
    const safeCurrency = currency && currency.symbol ? currency : { symbol: '$' };
    if (value == null || isNaN(value)) return `${safeCurrency.symbol}0.00`;
  
    return `${safeCurrency.symbol}${Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };