// 11. ExportButtons.jsx
export default function ExportButtons({ data, viewMode }) {
  const exportCSV = () => {
    // Simple CSV export – you can enhance
    const csv = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales.csv'; a.click();
  };

  return (
    <div className="mt-6 text-center">
      <button onClick={exportCSV} className="px-5 py-2 bg-green-600 text-white rounded">
        Export CSV
      </button>
    </div>
  );
}