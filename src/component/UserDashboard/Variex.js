import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaRegMoneyBillAlt,
  FaMoneyCheckAlt,
  FaBoxes,
  FaChartLine,
  FaUsers,
  FaTasks,
  FaArrowLeft,
  FaReceipt,
  FaUndoAlt,
  FaBoxOpen,
  FaLock,
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DynamicInventory from '../DynamicSales/DynamicInventory';
import DynamicProducts from '../DynamicSales/DynamicProducts';
import DynamicSales from '../DynamicSales/DynamicSales';
import ReturnedItems from '../VariexContents/ReturnedItems';
import Unpaidsupplies from '../UserDashboard/Unpaidsupplies';
import DashboardAccess from '../Ops/DashboardAccess';
import UpdatedVariexReceipts from '../VariexContents/UpdatedVariexReceipts';
import VsalesSummary from '../Ops/VsalesSummary';
import Customers from './Customers';
import DebtTracker from './DebtTracker';
import ExpenseTracker from './ExpenseTracker';
import StockTransfer from './StockTransfer';

const tools = [
  {
    key: 'sales',
    label: 'Sales Tracker',
    icon: <FaChartLine className="text-2xl sm:text-5xl text-indigo-600" />,
    desc: 'Add your sales and see how your business is doing.',
    component: <DynamicSales />,
    isFreemium: true,
  },
  {
    key: 'products',
    label: 'Products & Pricing Tracker',
    icon: <FaBoxes className="text-2xl sm:text-5xl text-indigo-600" />,
    desc: 'Add and manage your store’s products, prices, and stock here.',
    component: <DynamicProducts />,
    isFreemium: true,
  },
  {
    key: 'stock_transfer',
    label: 'Stock Transfer',
    icon: <FaReceipt className="text-2xl sm:text-5xl text-indigo-600" />,
    desc: 'Easily Transfer Stock from one store to another.',
    component: <StockTransfer />,
    isFreemium: false,
  },
  {
    key: 'inventory',
    label: 'Manage Inventory (Goods)',
    icon: <FaTasks className="text-2xl sm:text-5xl text-indigo-600" />,
    desc: 'Keep an eye on how much goods you have sold and what is left in your store.',
    component: <DynamicInventory />,
    isFreemium: true,
  },
  {
    key: 'receipts',
    label: 'Sales Receipts',
    icon: <FaReceipt className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'Monitor store expenses.',
    component: <UpdatedVariexReceipts />,
    isFreemium: true,
  },
  {
    key: 'returns',
    label: 'Returned Items Tracker',
    icon: <FaUndoAlt className="text-2xl sm:text-6xl text-indigo-600" />,
    desc: 'Track returned items from customers.',
    component: <ReturnedItems />,
    isFreemium: false,
  },
  {
    key: 'expenses',
    label: 'Expenses Tracker',
    icon: <FaRegMoneyBillAlt className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'Keep track of your store’s spending.',
    component: <ExpenseTracker />,
    isFreemium: true,
  },
  {
    key: 'unpaid_supplies',
    label: 'Unpaid Supplies',
    icon: <FaBoxOpen className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'See who took goods on credit and hasn’t paid yet.',
    component: <Unpaidsupplies />,
    isFreemium: false,
  },
  {
    key: 'debts',
    label: 'Debtors',
    icon: <FaMoneyCheckAlt className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'Track debtors.',
    component: <DebtTracker />,
    isFreemium: false,
  },
  {
    key: 'sales_summary',
    label: 'Sales Summary',
    icon: <FaChartLine className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'View a summary of your sales performance.',
    component: <VsalesSummary />,
    isFreemium: true,
  },
  {
    key: 'customers',
    label: 'Customer Manager',
    icon: <FaUsers className="text-2xl sm:text-5xl  text-indigo-600" />,
    desc: 'Manage your customers.',
    component: <Customers />,
    isFreemium: false,
  },
];

// Mapping for common variations in allowed_features
const featureKeyMapping = {
  'products & pricing tracker': 'products',
  'products': 'products',
  'product tracker': 'products',
  'products tracker': 'products',
  'dynamic products': 'products',
  'suppliers & product tracker': 'suppliers',
  'suppliers': 'suppliers',
  'supplier': 'suppliers',
  'sales summary': 'sales_summary',
  'unpaid supplies': 'unpaid_supplies',
  'stock transfer': 'stock_transfer',
  'stock transfer tracker': 'stock_transfer',
};

export default function DynamicDashboard() {
  const [shopName, setShopName] = useState('Store Owner');
  const [activeTool, setActiveTool] = useState(null);
  const [allowedFeatures, setAllowedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const fetchStoreDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const storeId = localStorage.getItem('store_id');
      if (!storeId) {
        setError('No store assigned. Contact your admin.');
        toast.error('No store assigned. Contact your admin.');
        setAllowedFeatures([]);
        setIsLoading(false);
        return;
      }

      localStorage.removeItem(`features_${storeId}`);

      const { data, error } = await supabase
        .from('stores')
        .select('shop_name, premium, allowed_features')
        .eq('id', storeId)
        .single();

      if (error) {
        setError('Failed to load store details.');
        toast.error('Failed to load store details.');
        setShopName('Store Owner');
        setIsPremium(false);
        setAllowedFeatures([]);
        return;
      }

      setShopName(data?.shop_name || 'Store Owner');
      setIsPremium(data?.premium === true || (typeof data?.premium === 'string' && data.premium.toLowerCase() === 'true'));

      let features = [];
      if (Array.isArray(data?.allowed_features)) {
        features = data.allowed_features
          .map((item) => {
            const normalized = item?.trim().toLowerCase();
            return featureKeyMapping[normalized] || normalized;
          })
          .filter(Boolean);
      } else if (data?.allowed_features === '' || data?.allowed_features === '""') {
        features = [];
      } else if (typeof data?.allowed_features === 'string') {
        try {
          const parsed = JSON.parse(data.allowed_features);
          if (Array.isArray(parsed)) {
            features = parsed
              .map((item) => {
                const normalized = item?.trim().toLowerCase();
                return featureKeyMapping[normalized] || normalized;
              })
              .filter(Boolean);
          } else {
            setError('Invalid feature data. Contact support or your admin.');
            toast.error('Invalid feature data. Contact support or your admin.');
            features = [];
          }
        } catch (e) {
          setError('Invalid feature data. Contact support or your admin.');
          toast.error('Invalid feature data. Contact support or your admin.');
          features = [];
        }
      } else {
        setError('Invalid feature data. Contact support or your admin.');
        toast.error('Invalid feature data. Contact support or your admin.');
        features = [];
      }

      setAllowedFeatures(features);
      if (!data?.premium && features.length > 0) {
        setError('Some features are available only for premium users. Please upgrade your store’s subscription.');
      }
    } catch (err) {
      setError('An error occurred while loading store details.');
      toast.error('An error occurred while loading store details.');
      setShopName('Store Owner');
      setIsPremium(false);
      setAllowedFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetails();
  }, []);
  

    /* global gtag */


useEffect(() => {
  if (typeof gtag === 'function') {
    gtag('event', 'flexscan_open', {
      event_category: 'App',
      event_label: 'Dashboard Loaded',
    });
  }
}, []);


  useEffect(() => {
    if (!isLoading && activeTool && !allowedFeatures.includes(activeTool)) {
      setActiveTool(null);
      setError(`Access Denied: The selected feature is not enabled for your store. Contact your admin.`);
      toast.warn(`Access Denied: The selected feature is not enabled for your store.`);
    }
  }, [allowedFeatures, isLoading, activeTool]);

  const handleToolClick = (key) => {
    const tool = tools.find((t) => t.key === key);
    if (!allowedFeatures.includes(key)) {
      setError(`Access Denied: ${tool.label} is not enabled for your store. Contact your admin to unlock this feature.`);
      toast.warn(`Access Denied: ${tool.label} is not enabled for your store.`);
      return;
    }
    if (!tool.isFreemium && !isPremium) {
      setError(`Access Denied: ${tool.label} is a premium feature. Please upgrade your subscription.`);
      toast.warn(`Access Denied: ${tool.label} is a premium feature.`);
      return;
    }
    setActiveTool(key);
    setError('');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full bg-white dark:bg-gray-900 p-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
          </div>
        </div>
      );
    }

    if (activeTool) {
      const tool = tools.find((t) => t.key === activeTool);
      if (!allowedFeatures.includes(activeTool)) {
        return (
          <div className="w-full bg-white dark:bg-gray-900 p-4 max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
            <FaLock className="text-2xl sm:text-3xl mb-2" />
            <div className="text-red-500 dark:text-red-400">
              Access Denied: You do not have permission to view {tool.label}. Contact your admin to unlock this feature.
            </div>
          </div>
        );
      }
      if (!tool.isFreemium && !isPremium) {
        return (
          <div className="w-full bg-white dark:bg-gray-900 p-4 max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
            <FaLock className="text-2xl sm:text-3xl mb-2" />
            <p>This feature is available only for premium users. Please upgrade your store’s subscription.</p>
            <a
              href="/upgrade"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
            >
              Upgrade to Premium
            </a>
          </div>
        );
      }
      return (
        <div className="w-full bg-white dark:bg-gray-900 p-4 max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTool(null)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 text-xs sm:text-base"
              aria-label="Go back to tool selection"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>
            <h2 className="text-lg sm:text-2xl font-semibold text-indigo-700 dark:text-indigo-200">
              {tool.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{tool.desc}</p>
          </div>
          {tool.component}
        </div>
      );
    }

    return (
      <div className="relative flex-1 px-4 sm:px-6 grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        {tools.map((t) => (
          <div
            key={t.key}
            className={`relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-2 sm:p-6 rounded-xl shadow h-32 sm:h-48 transition ${
              allowedFeatures.includes(t.key) && (t.isFreemium || isPremium)
                ? 'hover:shadow-lg cursor-pointer'
                : 'cursor-not-allowed'
            }`}
            onClick={() => handleToolClick(t.key)}
            title={
              allowedFeatures.includes(t.key) && (t.isFreemium || isPremium)
                ? t.desc
                : `Locked: ${t.label} is not enabled or is a premium feature.`
            }
            aria-label={`Select ${t.label}`}
          >
            {t.icon}
            <span className="mt-2 text-xs sm:text-base font-medium text-indigo-800 dark:text-indigo-400">
              {t.label}
            </span>
            {(!allowedFeatures.includes(t.key) || (!t.isFreemium && !isPremium)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200/20 dark:bg-gray-700/20 rounded-xl">
                <FaLock className="text-red-300 dark:text-red-500 text-2xl sm:text-3xl" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 w-full flex flex-col">
      <ToastContainer />
      <DashboardAccess />
      <header className="text-center mb-4 sm:mb-6 pt-4 sm:pt-6">
        <h1 className="text-lg sm:text-3xl font-bold text-indigo-800 dark:text-white">
          Welcome, {shopName}!
        </h1>
        {!activeTool && (
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-xs sm:text-sm">
            Choose a tool to continue.
          </p>
        )}
      </header>
      {!isPremium && (
        <div className="px-3 sm:px-6 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 py-1 rounded-full">
            <FaLock className="text-yellow-600 text-xs" /> Want to Access More Features? Upgrade to Premium!
          </span>
          <a
            href="/upgrade"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 text-white font-medium text-xs sm:text-sm py-1.5 px-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Upgrade Now
          </a>
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 dark:text-red-400 mb-4 text-xs sm:text-sm">
          {error}
        </div>
      )}
      {renderContent()}
      <div className="p-4 max-w-7xl mx-auto">
        <button
          onClick={() => {
            localStorage.removeItem(`features_${localStorage.getItem('store_id')}`);
            fetchStoreDetails();
          }}
          className="text-indigo-600 dark:text-indigo-400 text-sm underline hover:text-indigo-800 dark:hover:text-indigo-300"
          aria-label="Refresh store details"
        >
          Refresh Store Details
        </button>
     

      </div>
    </div>
  );
}