// components/CurrencySelector.js
import { useCurrency } from './CurrencyContext';

export default function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Currency:</label>
      <select
        value={currency.code}
        onChange={(e) => {
          const selected = currencies.find(c => c.code === e.target.value);
          setCurrency(selected);
        }}
        className="p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}