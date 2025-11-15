import React, { useState, useEffect } from 'react';
import { FaUsers, FaBell, FaChartBar, FaUserFriends, FaArrowLeft } from 'react-icons/fa';
import StoreAdmins from './StoreAdmins';
import NotificationAlertReports from './NotificationAlertReports';
import ActivityDashboard from './ActivityDashboard';
import Employees from './Employees'; // Fixed typo: Employess → Employees
import { supabase } from '../../supabaseClient';

const dashboardTools = [
  {
    key: 'store-admins',
    label: 'Store Admins',
    icon: <FaUsers className="text-xl sm:text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400" />,
    desc: 'Manage Staff Access & Roles (Assign Access & Roles)',
    component: <StoreAdmins />,
    adminOnly: true,
  },
  {
    key: 'notifications',
    label: 'Alerts & Reports',
    icon: <FaBell className="text-xl sm:text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400" />,
    desc: 'Manage email alerts  notification reports you want to receive',
    component: <NotificationAlertReports />,
    adminOnly: true,
  },
  {
    key: 'employees',
    label: 'Employees',
    icon: <FaUserFriends className="text-xl sm:text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400" />,
    desc: 'Manage employee profiles and access.',
    component: <Employees />,
    adminOnly: true,
  },
  {
    key: 'activity',
    label: 'Activity Dashboard',
    icon: <FaChartBar className="text-xl sm:text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400" />,
    desc: 'Monitor real-time activity and store updates.',
    component: <ActivityDashboard />,
    adminOnly: false,
  },
];

export default function UserDashboard() {
  const [, setShopName] = useState('User Dashboard');
  const [activeTool, setActiveTool] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableTools, setAvailableTools] = useState([]);

  useEffect(() => {
    async function checkUserAccess() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const userEmail = localStorage.getItem('user_email');
        if (!userEmail) {
          setErrorMessage('No user email found. Please log in.');
          setIsLoading(false);
          return;
        }

        let fetchedShopName = 'User Dashboard';
        let hasAdminAccess = false;

        // Check if user is store owner (email in `stores.owner_email`)
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('shop_name')
          .ilike('email_address', userEmail)
          .maybeSingle();

        if (storeError && storeError.code !== 'PGRST116') {
          console.error('Error checking store owner:', storeError);
        }

        if (storeData) {
          hasAdminAccess = true;
          fetchedShopName = storeData.shop_name || 'My Store';
        }

        setIsAdmin(hasAdminAccess);
        setShopName(fetchedShopName);

        // Filter tools: Show admin-only tools if admin, always show non-admin tools
        const filtered = dashboardTools.filter(tool => 
          !tool.adminOnly || hasAdminAccess
        );

        setAvailableTools(filtered);
      } catch (err) {
        setErrorMessage('Failed to load dashboard access.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserAccess();
  }, []);

  const handleToolClick = (key) => {
    setActiveTool(key);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (activeTool) {
      const tool = availableTools.find(t => t.key === activeTool);
      if (!tool) return null;

      return (
        <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto">
          <div className="px-4 sm:px-6">
            <button
              onClick={() => setActiveTool('')}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base"
              aria-label="Back to Dashboard"
            >
              <FaArrowLeft className="mr-2" /> Back to Dashboard
            </button>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              {tool.label}
            </h2>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm md:text-base mb-4">
              {tool.desc}
            </p>
          </div>
          <div className="flex-1 w-full overflow-auto">
            {React.cloneElement(tool.component, { setActiveTool })}
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex-1 px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-7xl mx-auto overflow-hidden">
        {availableTools.map((t) => (
          <div
            key={t.key}
            className="relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 h-40 sm:h-48 md:h-56 w-full transition hover:shadow-lg cursor-pointer"
            onClick={() => handleToolClick(t.key)}
            title={`Open ${t.label}`}
            aria-label={`Select ${t.label}`}
          >
            {t.icon}
            <span className="mt-2 text-xs sm:text-sm md:text-base font-medium text-indigo-600 dark:text-indigo-400">
              {t.label}
            </span>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm text-center mt-1">
              {t.desc}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      <header className="text-center pt-4 sm:pt-6">
      
        <p className="text-indigo-600 dark:text-indigo-400 mt-1 text-xs sm:text-sm md:text-base">
          {isAdmin
            ? ''
            : ''}
        </p>
      </header>

      {errorMessage && (
        <div className="text-center text-red-500 dark:text-red-400 mb-4 text-xs sm:text-sm max-w-7xl mx-auto px-4">
          {errorMessage}
        </div>
      )}

      {renderContent()}
    </div>
  );
}