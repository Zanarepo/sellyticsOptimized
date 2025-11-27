// src/components/stockTransfer/useStockTransfer.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient"; // adjust path if needed
import { toast } from "react-toastify";

export const useStockTransfer = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(localStorage.getItem("store_id") || "");
  const [inventory, setInventory] = useState([]);
  const [fullInventory, setFullInventory] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || null);
  const [storeIdState, setStoreIdState] = useState(localStorage.getItem("store_id") || null);
  const [ownerIdState, setOwnerIdState] = useState(localStorage.getItem("owner_id") || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = transferHistory.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(transferHistory.length / entriesPerPage);

  const paginate = (page) => page >= 1 && page <= totalPages && setCurrentPage(page);

  // User & ownership detection
  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true);
      try {
        let email = localStorage.getItem("user_email");
        if (!email) {
          const { data } = await supabase.auth.getUser();
          email = data?.user?.email;
        }
        if (!email) throw new Error("Login required");

        const { data: storeData, error: sErr } = await supabase
          .from("stores")
          .select("id, owner_user_id")
          .eq("email_address", email)
          .maybeSingle();

        if (sErr) throw sErr;

        if (storeData) {
          setIsStoreOwner(true);
          const sid = String(storeData.id);
          const oid = storeData.owner_user_id ? String(storeData.owner_user_id) : "";
          setStoreIdState(sid);
          setOwnerIdState(oid);
          localStorage.setItem("store_id", sid);
          if (oid) localStorage.setItem("owner_id", oid);

            const { data: u } = await supabase
              .from("store_users")
              .select("id")
              .eq("email_address", email)
              .eq("store_id", storeData.id)
              .maybeSingle();
            if (u) {
              setUserId(String(u.id));
              localStorage.setItem("user_id", String(u.id));
            } else {
            const { data: userData, error } = await supabase
              .from("store_users")
              .select("id, store_id, owner_id")
              .eq("email_address", email)
              .maybeSingle();
            if (error || !userData) throw new Error("User not found in any store");
            setUserId(String(userData.id));
            setStoreIdState(String(userData.store_id));
            setOwnerIdState(userData.owner_id ? String(userData.owner_id) : "");
            localStorage.setItem("user_id", String(userData.id));
            localStorage.setItem("store_id", String(userData.store_id));
            if (userData.owner_id) localStorage.setItem("owner_id", String(userData.owner_id));
          }
        }
      } catch (e) {
        toast.error(e.message || "Auth failed");
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  const fetchInventory = useCallback(async (storeId) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dynamic_inventory")
        .select(`
          id, dynamic_product_id, available_qty,
          dynamic_product:dynamic_product_id (id, name)
        `)
        .eq("store_id", storeId);
      if (error) throw error;
      setFullInventory(data || []);
      setInventory(data || []);
    } catch (e) {
      toast.error("Inventory load failed");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStores = useCallback(async (ownerId) => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, shop_name")
        .eq("owner_user_id", ownerId)
        .order("shop_name");
      if (error) throw error;
      setStores(data || []);
      if (!selectedStore && data?.length) {
        const id = String(data[0].id);
        setSelectedStore(id);
        localStorage.setItem("store_id", id);
        await fetchInventory(id);
      }
    } catch (e) {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, fetchInventory]);
  const fetchHistory = useCallback(async (ownerId) => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stock_transfer_requests")
        .select(`
          id, quantity, status, requested_at,
          source_store: source_store_id (shop_name),
          destination_store: destination_store_id (shop_name),
          product: dynamic_product_id (name, selling_price)
        `)
        .eq("store_owner_id", ownerId)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      const enriched = data.map(t => ({
        ...t,
        worth: (t.product?.selling_price || 0) * t.quantity
      }));
      setTransferHistory(enriched);
    } catch (e) {
      toast.error("History load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto load
  useEffect(() => {
    if (!loadingUser) {
      if (isStoreOwner && ownerIdState) {
        fetchStores(ownerIdState);
        fetchHistory(ownerIdState);
      }
      if (selectedStore) fetchInventory(selectedStore);
      else if (storeIdState) {
        setSelectedStore(storeIdState);
        fetchInventory(storeIdState);
      }
    }
  }, [loadingUser, isStoreOwner, ownerIdState,fetchHistory, fetchInventory,storeIdState, fetchStores, selectedStore]);

  // Search
  useEffect(() => {
    if (!searchQuery) return setInventory(fullInventory);
    const q = searchQuery.toLowerCase();
    setInventory(
      fullInventory.filter(i =>
        (i.dynamic_product?.name ?? `Product #${i.dynamic_product_id}`)
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchQuery, fullInventory]);

  const handleStoreChange = (id) => {
    setSelectedStore(id);
    localStorage.setItem("store_id", id);
    fetchInventory(id);
    setSearchQuery("");
  };

  const refreshData = () => {
    if (selectedStore) fetchInventory(selectedStore);
    if (ownerIdState) fetchHistory(ownerIdState);
  };

  return {
    stores,
    selectedStore,
    inventory,
    transferHistory,
    currentEntries,
    totalPages,
    currentPage,
    loading,
    loadingUser,
    isStoreOwner,
    searchQuery,
    setSearchQuery,
    handleStoreChange,
    paginate,
    refreshData,
    userId,
    ownerIdState,
  };
};