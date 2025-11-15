// Dashboard.js
import React, { useState } from 'react';
import TeamMembers from './TeamMembers';
import InviteLink from './InviteLink';
import { FaUserFriends, FaLink } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('teamMembers');

  const renderContent = () => {
    switch (activeTab) {
      case 'teamMembers':
        return <TeamMembers />;
      case 'inviteLink':
        return <InviteLink />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800  text-gray-700 dark:text-white">
  
      
      {/* Icon Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setActiveTab('teamMembers')}
            className={`flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
              ${activeTab === 'teamMembers' ? 'border-2 border-indigo-500' : ''}`}
          >
            <FaUserFriends className="text-4xl text-indigo-600 mb-2" />
            <span className="text-lg text-indigo-800 dark:text-white">Team Members</span>
          </button>
          <button
            onClick={() => setActiveTab('inviteLink')}
            className={`flex flex-col items-center p-4 bg-white dark:bg-gray-900  hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
              ${activeTab === 'inviteLink' ? 'border-2 border-indigo-500' : ''}`}
          >
            <FaLink className="text-4xl text-indigo-600 mb-2" />
            <span className="text-lg text-indigo-800 dark:text-white">Invite Link</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-900 ">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
