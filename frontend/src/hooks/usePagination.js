import { useState, useMemo } from 'react';

/**
 * Hook de pagination côté client.
 * @param {Array}  items        - Liste complète (déjà filtrée)
 * @param {number} itemsPerPage - Nombre d'éléments par page (défaut : 15)
 * @returns {{ currentItems, currentPage, totalPages, totalItems, setCurrentPage, resetPage }}
 */
export const usePagination = (items = [], itemsPerPage = 15) => {
  const [currentPage, setCurrentPageRaw] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  // Clamp automatique si la liste rétrécit (ex. après filtre)
  const page = Math.min(Math.max(1, currentPage), totalPages);

  const currentItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const setCurrentPage = (p) =>
    setCurrentPageRaw(Math.max(1, Math.min(p, totalPages)));

  const resetPage = () => setCurrentPageRaw(1);

  return { currentItems, currentPage: page, totalPages, totalItems: items.length, setCurrentPage, resetPage };
};

export default usePagination;
