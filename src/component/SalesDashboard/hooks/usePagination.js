// src/components/SalesDashboard/hooks/usePagination.js
import { useState, useMemo } from "react";

export default function usePagination(data = [], itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1);

  const pageCount = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, pageCount)));
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return { currentPage, setCurrentPage, pageData, pageCount, goToPage, nextPage, prevPage };
}
