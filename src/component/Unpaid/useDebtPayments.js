// components/Unpaid/useDebtPayments.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

export default function useDebtPayments(storeId) {
  const pageSize = 20;
  const detailPageSize = 20;

  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('All');
  const [soldDeviceIds, setSoldDeviceIds] = useState([]);
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);

  const fetchDebts = useCallback(async () => {
    if (!storeId) return;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('debts')
      .select('id, customer_id, dynamic_product_id, customer_name, product_name, device_id, qty, owed, deposited, remaining_balance, paid_to, date, created_at', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('Failed to fetch debts.');
      return;
    }

    const seen = new Set();
    const latestDebts = data.reduce((acc, d) => {
      const key = `${d.customer_id}-${d.dynamic_product_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        acc.push({
          ...d,
          deviceIds: d.device_id ? d.device_id.split(',').map(id => id.trim()).filter(Boolean) : [],
          status: d.remaining_balance <= 0 ? 'paid' : d.deposited > 0 ? 'partial' : 'owing',
          last_payment_date: d.date,
        });
      }
      return acc;
    }, []);

    setDebts(latestDebts);
    setTotalCount(count || 0);
  }, [page, storeId]);

  const checkSoldDevices = async (deviceIds) => {
    if (!deviceIds?.length) return [];
    setIsLoadingSoldStatus(true);
    try {
      const { data } = await supabase
        .from('dynamic_sales')
        .select('device_id')
        .in('device_id', deviceIds);
      const sold = data.map(d => d.device_id.trim());
      setSoldDeviceIds(sold);
      return sold;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoadingSoldStatus(false);
    }
  };

  const metrics = useMemo(() => {
    let unpaidDevices = 0, unpaidWorth = 0, paidDevices = 0, paidAmount = 0;

    debts.forEach(d => {
      const count = d.deviceIds.length || d.qty || 1;
      if (d.status === 'paid') {
        paidDevices += count;
        paidAmount += d.deposited;
      } else {
        unpaidDevices += count;
        unpaidWorth += d.remaining_balance;
      }
    });

    return { unpaidDevices, unpaidWorth, paidDevices, paidAmount };
  }, [debts]);

  useEffect(() => {
    let filtered = debts;

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        String(d.dynamic_product_id).includes(q) ||
        (d.paid_to || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'Paid') filtered = filtered.filter(d => d.status === 'paid');
    if (statusFilter === 'Unpaid') filtered = filtered.filter(d => d.status !== 'paid');

    // Priority unpaid when "All"
    if (statusFilter === 'All') {
      filtered.sort((a, b) => (b.remaining_balance > 0) - (a.remaining_balance > 0));
    }

    // Sorting
    filtered.sort((a, b) => {
      let A = a[sortColumn] ?? '', B = b[sortColumn] ?? '';
      if (sortColumn === 'last_payment_date') {
        A = A ? new Date(A).getTime() : 0;
        B = B ? new Date(B).getTime() : 0;
      } else if (sortColumn === 'created_at') {
        A = new Date(a.created_at).getTime();
        B = new Date(b.created_at).getTime();
      } else if (typeof A === 'string') {
        A = A.toLowerCase();
        B = B.toLowerCase();
      }

      if (A < B) return sortDirection === 'asc' ? -1 : 1;
      if (A > B) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDebts(filtered);
  }, [debts, search, sortColumn, sortDirection, statusFilter]);

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection(col === 'created_at' ? 'desc' : 'asc');
    }
  };

  return {
    debts,
    filteredDebts,
    search,
    setSearch,
    page,
    setPage,
    totalCount,
    pageSize,
    sortColumn,
    sortDirection,
    statusFilter,
    setStatusFilter,
    handleSort,
    fetchDebts,
    metrics,
    soldDeviceIds,
    isLoadingSoldStatus,
    checkSoldDevices,
    detailPageSize,
  };
}