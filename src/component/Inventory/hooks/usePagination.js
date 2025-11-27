import { useState, useMemo } from 'react';

/**
 * Generic pagination hook
 * @param {array} items - array of items to paginate
 * @param {number} itemsPerPage - number of items per page
 * @returns {object} { page, setPage, totalPages, paginatedItems, nextPage, prevPage, goToPage }
 */
export default function usePagination(items = [], itemsPerPage = 10) {
  const [page, setPage] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = page * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setPage((p) => Math.max(p - 1, 0));
  const goToPage = (p) => setPage(Math.min(Math.max(p, 0), totalPages - 1));

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage,
  };
}
