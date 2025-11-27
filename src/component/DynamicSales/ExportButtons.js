import React from "react";
import { FaFileCsv, FaFilePdf } from "react-icons/fa";
import { useCurrency } from "../DynamicSales/components/CurrencyContext";

export default function ExportButtons({ viewMode, filtered, totalsData }) {
  const { formatCurrency } = useCurrency();

  const exportCSV = () => {
    let csv = "";
    if (viewMode === "list") {
      csv = 'Product,Product IDs,Product Sizes,Quantity,Unit Price,Amount,Payment Method,Sold At\n';
      filtered.forEach((s) => {
        csv += [
          `"${(s.dynamic_product?.name || "").replace(/"/g, '""')}"`,
          s.deviceIds.join(';') || '-',
          s.deviceSizes.join(';') || '-',
          s.quantity,
          (s.unit_price || 0).toFixed(2),
          (s.amount || 0).toFixed(2),
          s.payment_method,
          `"${new Date(s.sold_at).toLocaleString()}"`,
        ].join(',') + '\n';
      });
    } else {
      csv = 'Period,Total Sales,Number of Sales\n';
      totalsData.forEach((t) => {
        csv += [`"${t.period.replace(/"/g, '""')}"`, t.total.toFixed(2), t.count].join(',') + '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = viewMode === 'list' ? 'sales.csv' : `${viewMode}_totals.csv`;
    link.click();
    URL.revokeObjectURL(url);
    // toast or visual feedback can be added by parent
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 10;
    doc.text(viewMode === 'list' ? 'Sales Report' : `${viewMode} Sales Totals`, 10, y);
    y += 10;
    if (viewMode === 'list') {
      filtered.forEach((s) => {
        doc.text(
          `Product: ${s.dynamic_product?.name || ''}, Qty: ${s.quantity}, Unit: ${formatCurrency(s.unit_price || 0)}, Amt: ${formatCurrency(s.amount || 0)}, Pay: ${s.payment_method}`,
          10, y
        );
        y += 10;
        if (y > 280) { doc.addPage(); y = 10; }
      });
    } else {
      totalsData.forEach((t) => {
        doc.text(`Period: ${t.period}, Total: ${formatCurrency(t.total)}, Sales: ${t.count}`, 10, y);
        y += 10;
        if (y > 280) { doc.addPage(); y = 10; }
      });
    }
    doc.save(viewMode === 'list' ? 'sales.pdf' : `${viewMode}_totals.pdf`);
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
      <button onClick={exportCSV} className="flex items-center gap-2 w-full sm:w-44 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        <FaFileCsv className="w-4 h-4" /> <span>Export CSV</span>
      </button>
      <button onClick={exportPDF} className="flex items-center gap-2 w-full sm:w-44 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <FaFilePdf className="w-4 h-4" /> <span>Export PDF</span>
      </button>
    </div>
  );
}
