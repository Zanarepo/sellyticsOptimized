import { useState, useEffect, useCallback } from 'react';
import { getDynamicProducts } from '../utils/supabaseQueries';
import { toast } from 'react-toastify';

/**
 * Hook to manage dynamic products
 * @param {number|string} storeId - current store ID
 */
export default function useDynamicProducts(storeId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------
  // Fetch products
  // -------------------------
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getDynamicProducts(storeId);

    if (fetchError) {
      setError(fetchError);
      toast.error(`Failed to fetch products: ${fetchError.message}`);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }, [storeId]);

  // -------------------------
  // Initial fetch
  // -------------------------
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // -------------------------
  // Helpers
  // -------------------------

  /**
   * Get product by ID
   * @param {number} productId
   * @returns {object|null}
   */
  const getProductById = useCallback(
    (productId) => products.find((p) => p.id === productId) || null,
    [products]
  );

  /**
   * Search products by name
   * @param {string} searchTerm
   * @returns {array}
   */
  const searchProducts = useCallback(
    (searchTerm) => {
      if (!searchTerm) return products;
      const term = searchTerm.toLowerCase();
      return products.filter((p) => (p.name || '').toLowerCase().includes(term));
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProductById,
    searchProducts,
  };
}
