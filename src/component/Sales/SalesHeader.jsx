// sales/SalesHeader.jsx
import CreateCustomer from '../DynamicSales/CreateCustomer'
import { FaPlus } from 'react-icons/fa';

export default function SalesHeader({ viewMode, setViewMode, search, setSearch, onNewSale }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <select value={viewMode} onChange={e => setViewMode(e.target.value)}
          className="p-2 border rounded dark:bg-gray-800 view-mode-selector">
          <option value="list">Individual Sales</option>
          <option value="daily">Daily Totals</option>
          <option value="weekly">Weekly Totals</option>
        </select>
        {viewMode === 'list' && (
          <input
            type="text"
            placeholder="Search by product, IMEI, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 border rounded w-full sm:w-64 dark:bg-gray-800 search-input"
          />
        )}
        <CreateCustomer />
      </div>
      <button onClick={onNewSale}
        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 new-sale-button">
        <FaPlus /> New Sale
      </button>
    </div>
  );
}