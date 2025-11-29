// src/components/SalesDashboard/hooks/useSalesFilters.js

import { useState, useMemo } from "react";
import {
  startOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
} from "date-fns";

export default function useSalesFilters(sales = []) {
  // States for date & search
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ----- PRESET HANDLER -----
  const applyPreset = (preset) => {
    const now = new Date();

    switch (preset) {
      case "today":
        setStartDate(startOfDay(now));
        setEndDate(now);
        break;

      case "7days":
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;

      case "week":
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(now);
        break;

      case "month":
        setStartDate(startOfMonth(now));
        setEndDate(now);
        break;

      default:
        break;
    }
  };

  // ----- FILTER LOGIC -----
  const filteredData = useMemo(() => {
    if (!Array.isArray(sales)) return [];

    return sales.filter((sale) => {
      const saleDate = new Date(sale.soldAt);

      const dateMatch =
        (!startDate || saleDate >= new Date(startDate)) &&
        (!endDate || saleDate <= new Date(endDate));

      const searchMatch =
        !searchQuery ||
        sale.productName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      return dateMatch && searchMatch;
    });
  }, [sales, startDate, endDate, searchQuery]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    filteredData,   // ✅ FIXED
    applyPreset,    // ✅ ADDED
  };
}
