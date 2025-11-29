// src/components/SalesDashboard/utils/formatCurrency.js
export function formatCurrency(value = 0, preferredCurrency = { code: "NGN", symbol: "₦" }) {
    const num = Number(value) || 0;
    const abs = Math.abs(num);
  
    // For really large numbers use compact suffix (1.2M, 3.4K)
    if (abs >= 1_000_000) {
      const suffixes = ["", "K", "M", "B", "T"];
      const tier = Math.floor(Math.log10(abs) / 3);
      const suffix = suffixes[tier] || "";
      const scale = Math.pow(1000, tier);
      const scaled = num / scale;
      // Keep one decimal if it improves readability
      return `${preferredCurrency.symbol}${scaled.toFixed(1)}${suffix}`;
    }
  
    // Default: localized currency with two decimals
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: preferredCurrency.code || "NGN",
        minimumFractionDigits: 2,
      }).format(num);
    } catch (err) {
      // Fallback
      return `${preferredCurrency.symbol}${num.toFixed(2)}`;
    }
  }
  