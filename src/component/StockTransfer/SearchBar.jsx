// src/components/stockTransfer/SearchBar.jsx
export default function SearchBar({ value, onChange, disabled }) {
    return (
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Search Inventory</label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Search products..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  }