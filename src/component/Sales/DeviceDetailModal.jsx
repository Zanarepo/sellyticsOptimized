// sales/DeviceDetailModal.jsx
export default function DeviceDetailModal({ show, onClose, devices, search }) {
    if (!show) return null;
  
    const filteredDevices = devices.filter(d =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.size.toLowerCase().includes(search.toLowerCase())
    );
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Device IDs & Sizes</h3>
          <ul className="space-y-2">
            {filteredDevices.map((d, i) => (
              <li key={i} className="py-2 border-b dark:border-gray-700">
                ID: <strong>{d.id}</strong> {d.size && `(Size: ${d.size})`}
              </li>
            ))}
          </ul>
          <button onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    );
  }