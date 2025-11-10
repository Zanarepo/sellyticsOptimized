// src/pages/AdminOnboardStores.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import GadgetsDynamicProducrs from '../UserDashboard/GadgetsDynamicProducts';
import { getAdminStatus } from '../Auth/adminAuth';
import { FaStore, FaUserCog, FaSearch } from 'react-icons/fa';

function AdminOnboardStores() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState({ id: null, email: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const navigate = useNavigate();

  // Validate admin from localStorage
  useEffect(() => {
    const { isAdmin, adminId, email } = getAdminStatus();

    if (!isAdmin) {
      toast.error('Access denied. Admin login required.');
      navigate('/');
      return;
    }

    setAdminInfo({ id: adminId, email });
    fetchStores();
  }, [navigate]);

  // Fetch stores
  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stores')
      .select('id, shop_name, full_name, email_address, phone_number, business_address')
      .order('shop_name', { ascending: true })
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error:', error);
      toast.error(`Failed to load stores: ${error.message}`);
    } else {
      setStores(data || []);
      setFilteredStores(data || []);
    }
    setLoading(false);
  };

  // Search & Filter
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    const filtered = stores.filter(store =>
      store.shop_name?.toLowerCase().includes(lowerSearch) ||
      store.full_name?.toLowerCase().includes(lowerSearch) ||
      store.email_address?.toLowerCase().includes(lowerSearch) ||
      store.phone_number?.toLowerCase().includes(lowerSearch)
    );
    setFilteredStores(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, stores]);

  // Pagination
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const paginatedStores = filteredStores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectStore = (store) => setSelectedStore(store);
  const handleBack = () => setSelectedStore(null);

  if (!adminInfo.id) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaUserCog className="text-3xl text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Admin Product Onboarding
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {adminInfo.email} (Admin ID: {adminInfo.id})
              </p>
            </div>
          </div>
        </div>

        {/* Store List */}
        {!selectedStore ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Select Store to Onboard
            </h2>

            {/* Search + Count */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by shop, owner, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredStores.length}</span> of{' '}
                <span className="font-medium">{stores.length}</span> stores
              </div>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading stores...</p>
            ) : filteredStores.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No stores found.</p>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedStores.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => handleSelectStore(store)}
                      className="p-4 border rounded-lg cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FaStore className="text-indigo-600" />
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                          {store.shop_name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {store.full_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {store.email_address}
                      </p>
                      {store.phone_number && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {store.phone_number}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Onboard Products */
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Onboarding: {selectedStore.shop_name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedStore.full_name} • {selectedStore.email_address}
                </p>
              </div>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Change Store
              </button>
            </div>

            <GadgetsDynamicProducrs overrideStoreId={selectedStore.id.toString()} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOnboardStores;