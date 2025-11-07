import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaBars,
  FaTimes,
  FaBarcode,
  FaQrcode,
  FaBell,
  FaIdBadge,
  FaHome,
  FaRobot,
  FaUserShield,
  FaMoneyBillWave,
} from 'react-icons/fa';

import StoreUsersTour from './StoreUsersTour';
import WhatsapUsers from './WhatsapUsers';
import StoreUserProfile from './StoreUsersProfile';
import Colleagues from './Colleagues';
import Notifications from './Notifications';
import StoreUsersVariex from './StoreUsersVariex';
import UsersERetailStores from './UsersERetailStores';
import AIpowerInsights from './AIpowerInsights';
import AdminOps from './AdminOps';
import Financials from '../Ops/Financials'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Fix Scan');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const navigate = useNavigate();

  // Check if tour has been shown before
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setIsTourOpen(true);
    }
  }, []);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Close tour and mark as seen
  const handleTourClose = () => {
    setIsTourOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'AI Insights':
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <AIpowerInsights />
          </div>
        );
      case 'Flex Scan':
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <StoreUsersVariex />
          </div>
        );
      case 'Fix Scan':
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <UsersERetailStores />
          </div>
        );
      case 'Financials':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <Financials />
          </div>
        );
      case 'Admin Ops':
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <AdminOps />
          </div>
        );
      case 'Profile':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <StoreUserProfile />
          </div>
        );
      case 'Colleagues':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <Colleagues />
          </div>
        );
      case 'Notifications':
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <Notifications />
          </div>
        );
      default:
        return (
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            Dashboard Content
          </div>
        );
    }
  };

  // Handle navigation click: update active tab and close sidebar on mobile
  const handleNavClick = (tab) => {
    if (tab === 'Home') {
      navigate('/');
    } else {
      setActiveTab(tab);
      setSidebarOpen(false);
    }
  };

  // Navigation items
  const navItems = [
    { name: 'Home', icon: FaHome, aria: 'Home: Go to the landing page', dataTour: 'home' },
    { name: 'Flex Scan', icon: FaBarcode, aria: 'Flex Scan: Access your store management tools', dataTour: 'toolkits' },
    { name: 'Fix Scan', icon: FaQrcode, aria: 'Fix Scan: Fixed barcode scanning', dataTour: 'fix-scan' },
    { name: 'AI Insights', icon: FaRobot, aria: 'AI Insights: Access AI-powered insights', dataTour: 'ai-insights' },
    { name: 'Admin Ops', icon: FaUserShield, aria: 'Admin Operations: Manage store operations', dataTour: 'admin-ops' },
    { name: 'Financials', icon: FaMoneyBillWave, aria: 'Finances: See all your financial records', dataTour: 'finance' },
    { name: 'Notifications', icon: FaBell, aria: 'Notifications: Stay updated with store-related notifications', dataTour: 'notifications' },
    { name: 'Colleagues', icon: FaIdBadge, aria: 'Colleagues: Manage your colleagues', dataTour: 'colleagues' },
    { name: 'Profile', icon: FaUser, aria: 'Profile: View and edit your profile', dataTour: 'profile' },
  ];

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <WhatsapUsers />
       

      <StoreUsersTour
        isOpen={isTourOpen}
        onClose={handleTourClose}
        setActiveTab={setActiveTab}
      />
      <aside
        className={`fixed md:static top-0 left-0 h-full transition-all duration-300 bg-gray-100 dark:bg-gray-800 z-40 ${
          sidebarOpen ? 'w-64' : 'w-0 md:w-16'
        } ${sidebarOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="p-4 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold text-indigo-800 dark:text-indigo-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
              Menu
            </h2>
            <button
              onClick={toggleSidebar}
              className="text-indigo-800 dark:text-indigo-200 md:hidden"
              aria-label="Close sidebar"
            >
              <FaTimes size={24} />
            </button>
          </div>
          <nav className="pt-8">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li
                  key={item.name}
                  data-tour={item.dataTour}
                  onClick={() => handleNavClick(item.name)}
                  className={`flex items-center p-2 rounded cursor-pointer transition hover:bg-indigo-300 dark:hover:bg-indigo-600 ${
                    activeTab === item.name ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label={item.aria}
                >
                  <item.icon
                    className={`text-indigo-800 dark:text-indigo-200 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}
                  />
                  <span className={`text-indigo-800 dark:text-indigo-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div
          className={`p-4 md:p-6 mt-auto flex items-center justify-between ${sidebarOpen ? 'block' : 'hidden md:flex'}`}
        >
          <span className={`text-indigo-800 dark:text-indigo-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
            {darkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            <div className="w-11 h-6 bg-indigo-800 dark:bg-gray-600 rounded-full transition-colors duration-300">
              <span
                className={`absolute left-1 top-1 bg-white dark:bg-indigo-200 w-4 h-4 rounded-full transition-transform duration-300 ${
                  darkMode ? 'translate-x-5' : ''
                }`}
              ></span>
            </div>
          </label>
        </div>
      </aside>

      <button
        onClick={toggleSidebar}
        className={`fixed top-4 md:top-4 transition-all duration-300 z-50 rounded-full p-2 bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 md:block hidden ${
          sidebarOpen ? 'left-64' : 'left-4'
        }`}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-indigo-800 dark:text-indigo-200"
            aria-label="Open sidebar"
          >
            <FaBars size={24} />
          </button>
          <h1 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{activeTab}</h1>
          <button
            onClick={() => {
              localStorage.removeItem('hasSeenTour');
              setIsTourOpen(true);
            }}
            className="text-indigo-800 dark:text-indigo-200 text-sm"
          ></button>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;