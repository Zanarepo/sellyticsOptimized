import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Trash2, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ActivityLogTable() {
  const [logs, setLogs] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canDelete, setCanDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const storeId = localStorage.getItem('store_id') ? parseInt(localStorage.getItem('store_id'), 10) : null;
  const userEmail = localStorage.getItem('user_email');

  /* --------------------------------------------------------------- */
  /*  PERMISSION CHECK                                                */
  /* --------------------------------------------------------------- */
  const checkDeletePermission = useCallback(async () => {
    if (!storeId || !userEmail) { setCanDelete(false); return; }
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('email_address')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      setCanDelete(data?.email_address?.toLowerCase() === userEmail.toLowerCase());
    } catch (err) {
      console.error('[Permission Check] Error:', err);
      setCanDelete(false);
    }
  }, [storeId, userEmail]);

  /* --------------------------------------------------------------- */
  /*  LOAD LOGS                                                       */
  /* --------------------------------------------------------------- */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!storeId) { toast.error('Store ID is missing.'); return; }

      const { data: salesLogs, error: salesError } = await supabase
        .from('sales_log')
        .select(`
          id, store_id, activity_type, details, created_at,
          dynamic_product_id,
          dynamic_product:dynamic_product!dynamic_product_id (id, name)
        `)
        .eq('store_id', storeId);
      if (salesError) throw salesError;

      const { data: productLogs, error: productError } = await supabase
        .from('product_logs')
        .select(`
          id, store_id, activity_type, details, created_at,
          dynamic_product_id,
          dynamic_product:dynamic_product!dynamic_product_id (id, name)
        `)
        .eq('store_id', storeId);
      if (productError) throw productError;

      const combined = [
        ...(salesLogs ?? []).map(l => ({ ...l, log_source: 'sales_log' })),
        ...(productLogs ?? []).map(l => ({ ...l, log_source: 'product_logs' })),
      ];

      const sorted = combined.sort((a, b) =>
        sortOrder === 'asc'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at)
      );

      setLogs(sorted);
      if (!sorted.length) toast.info('No activity logs found.');
    } catch (err) {
      console.error('[Load Logs] Error:', err);
      setError(err?.message || String(err));
      toast.error(err?.message || 'Failed to load logs.');
    } finally {
      setLoading(false);
    }
  }, [storeId, sortOrder]);

  /* --------------------------------------------------------------- */
  /*  DELETE LOG                                                      */
  /* --------------------------------------------------------------- */
  const handleDelete = async (logId, source) => {
    if (!canDelete) { toast.error('You do not have permission to delete logs.'); return; }
    if (!window.confirm('Delete this log?')) return;

    try {
      const table = source === 'sales_log' ? 'sales_log' : 'product_logs';
      const { error } = await supabase.from(table).delete().eq('id', logId);
      if (error) throw error;
      toast.success('Log deleted.');
      await loadLogs();
    } catch (err) {
      console.error('[Delete] Error:', err);
      toast.error(err?.message || 'Failed to delete log.');
    }
  };

  /* --------------------------------------------------------------- */
  /*  FORMAT OBJECT (RECURSIVE)                                       */
  /* --------------------------------------------------------------- */
  const formatLogObject = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return {};
    const out = {};

    for (const [k, v] of Object.entries(obj)) {
      const label = k
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/Id$/, 'ID')
        .replace(/Imeis$/, 'IMEI(s)');

      const fullLabel = prefix ? `${prefix} > ${label}` : label;

      let value = v;

      if (value === null || value === undefined) {
        value = '—';
      } else if (Array.isArray(value)) {
        value = value.length ? value.join(', ') : '—';
      } else if (typeof value === 'object') {
        const nested = formatLogObject(value, label);
        Object.entries(nested).forEach(([nk, nv]) => {
          out[nk] = nv;
        });
        continue;
      } else if (typeof value === 'string' && (k.toLowerCase().includes('at') || k.toLowerCase().includes('time'))) {
        try {
          const d = new Date(value);
          if (!isNaN(d)) {
            value = d.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }
        } catch {}
      }

      out[fullLabel] = String(value);
    }
    return out;
  };

  const formatActivityType = (type) => {
    const map = { insert: 'Created', update: 'Updated', delete: 'Deleted', sale: 'Sale Recorded' };
    return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  /* --------------------------------------------------------------- */
  /*  RENDER DETAILS (SALES & PRODUCT)                                */
  /* --------------------------------------------------------------- */
  const renderSalesLogDetails = (details) => {
    if (!details) return <p className="text-gray-500 italic">No details available</p>;

    let data = details;
    if (typeof details === 'string') {
      try { data = JSON.parse(details); } catch {
        return <pre className="text-xs text-red-600 bg-red-50 p-2 rounded">{details}</pre>;
      }
    }

    const beforeObj = data.before || {};
    const afterObj  = data.after  || data;

    const before = formatLogObject(beforeObj);
    const after  = formatLogObject(afterObj);

    const excluded = new Set([
      'Id', 'Created At', 'Updated At', 'Created By User Id',
      'Store Id', 'Device Id', 'Owner Id',
      'Created By User ID', 'Paid To', 'Sale Group ID', 'Dynamic Product IMEI(s)', 'Dynamic Product IDs', 'Customer Name', 'Dynamic Product ID',
      'Sold At', 'ID'
    ]);

    const isInsert = !data.before;
    const changedKeys = isInsert
      ? Object.keys(after).filter(k => !excluded.has(k.split(' > ').pop()))
      : Object.keys(after).filter(k => !excluded.has(k.split(' > ').pop()) && before[k] !== after[k]);

    if (!changedKeys.length) return <p className="text-gray-500 italic">No visible changes</p>;

    return (
      <div className="space-y-3">
        {changedKeys.map(key => (
          <div key={key} className="border-b border-gray-200 pb-2 last:border-0">
            <div className="font-semibold text-green-600 dark:text-gray-200">{key}</div>
            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
              {isInsert ? null : (
                <div className="text-red-600">
                  <span className="font-medium">Before:</span> {before[key] || '—'}
                </div>
              )}
              <div className={isInsert ? '' : 'text-green-600'}>
                <span className="font-medium">{isInsert ? 'Value:' : 'After:'}</span> {after[key] || '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProductLogChanges = (details) => {
    if (!details) return <p className="text-gray-500 italic">No changes recorded</p>;

    let data = details;
    if (typeof details === 'string') {
      try { data = JSON.parse(details); } catch {
        return <pre className="text-xs text-red-600 bg-red-50 p-2 rounded">{details}</pre>;
      }
    }

    const beforeObj = data.before || {};
    const afterObj  = data.after  || data;

    const before = formatLogObject(beforeObj);
    const after  = formatLogObject(afterObj);

    const excluded = new Set([
      'Id', 'Created At', 'Updated At', 'Created By User Id',
      'Markup Percent', 'Description', 'Owner Id',
      'Suppliers Name', 'Created By Store Id', 'Device Id',
    ]);

    const isInsert = !data.before;
    const changedKeys = isInsert
      ? Object.keys(after).filter(k => !excluded.has(k.split(' > ').pop()))
      : Object.keys(after).filter(k => !excluded.has(k.split(' > ').pop()) && before[k] !== after[k]);

    if (!changedKeys.length) return <p className="text-gray-500 italic">No visible changes</p>;

    return (
      <div className="space-y-3">
        {changedKeys.map(key => (
          <div key={key} className="border-b border-gray-200 pb-2 last:border-0">
            <div className="font-semibold text-gray-800 dark:text-gray-200">{key}</div>
            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
              {isInsert ? null : (
                <div className="text-red-600">
                  <span className="font-medium">Before:</span> {before[key] || '—'}
                </div>
              )}
              <div className={isInsert ? '' : 'text-green-600'}>
                <span className="font-medium">{isInsert ? 'Value:' : 'After:'}</span> {after[key] || '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* --------------------------------------------------------------- */
  /*  SEARCH & PAGINATION                                             */
  /* --------------------------------------------------------------- */
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;

    const lower = searchTerm.toLowerCase();
    return logs.filter(log => {
      const productName = log.dynamic_product?.name || '';
      const activity = formatActivityType(log.activity_type);
      const details = JSON.stringify(log.details || {}).toLowerCase();

      return (
        productName.toLowerCase().includes(lower) ||
        activity.toLowerCase().includes(lower) ||
        details.includes(lower)
      );
    });
  }, [logs, searchTerm]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(indexOfFirstItem + itemsPerPage, totalItems);
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* --------------------------------------------------------------- */
  /*  MOUNT                                                            */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    loadLogs();
    checkDeletePermission();
  }, [loadLogs, checkDeletePermission]);

  /* --------------------------------------------------------------- */
  /*  RENDER                                                          */
  /* --------------------------------------------------------------- */
  return (
   <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-gray-700 dark:text-white">

      <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-6">
        Activity Logs
      </h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* SEARCH + SORT */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-indigo-600 text-white">
            <tr>
              {['ID', 'Source', 'Activity', 'Product', 'Details', 'Time', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading logs...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No logs found.</td></tr>
            ) : (
              currentItems.map(log => (
                <tr
                  key={`${log.log_source}_${log.id}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.log_source === 'product_logs'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {log.log_source === 'product_logs' ? 'Product' : 'Sale'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatActivityType(log.activity_type)}</td>
                  <td className="px-4 py-3 max-w-xs truncate font-medium">
                    {log.dynamic_product?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewDetails(log)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(log.id, log.log_source)}
                      disabled={!canDelete}
                      className={`p-1 rounded transition ${
                        canDelete
                          ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      title={canDelete ? 'Delete log' : 'No permission'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION (EXACTLY YOUR DESIGN) */}
      <div className="flex flex-row flex-wrap justify-between items-center mt-4 gap-4">
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Showing {indexOfFirstItem + 1} to {indexOfLastItem} of {totalItems} logs
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-0.5 rounded-lg text-xs ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-700"
            }`}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`px-2 py-0.5 rounded-lg text-xs ${
                currentPage === i + 1
                  ? "bg-indigo-600 text-white dark:bg-indigo-800 dark:text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-0.5 rounded-lg text-xs ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {viewDetails.log_source === 'product_logs' ? 'Product Change' : 'Sale Record'}
              </h3>
              <button
                onClick={() => setViewDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >×</button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Product:</strong> {viewDetails.dynamic_product?.name || '—'}</p>
                <p><strong>Activity:</strong> {formatActivityType(viewDetails.activity_type)}</p>
                <p><strong>Time:</strong> {new Date(viewDetails.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              {viewDetails.log_source === 'product_logs'
                ? renderProductLogChanges(viewDetails.details)
                : renderSalesLogDetails(viewDetails.details)}
            </div>

            <button
              onClick={() => setViewDetails(null)}
              className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >Close</button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}