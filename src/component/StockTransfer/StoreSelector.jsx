// src/components/stockTransfer/StoreSelector.jsx
export default function StoreSelector({ stores, value, onChange, disabled }) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Source Store</label>
        <select
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select store</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.shop_name}</option>
          ))}
        </select>
      </div>
    );
  }