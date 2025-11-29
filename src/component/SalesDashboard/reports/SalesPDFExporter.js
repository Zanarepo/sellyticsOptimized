import jsPDF from "jspdf";
import { format } from "date-fns";

export default function SalesPDFExporter({ salesData, currencyFormatter, filename = "sales_report.pdf" }) {
  if (!salesData) return;

  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18);
  doc.text("Sales Report", 14, y);
  y += 10;
  doc.setFontSize(10);

  salesData.forEach((s) => {
    const line = `${format(new Date(s.soldAt), "yyyy-MM-dd")} | ${s.productName} | ${currencyFormatter(s.unitPrice)} | ${s.quantity} | ${currencyFormatter(s.totalSales)} | ${s.customerName || ""}`;
    doc.text(line, 14, y);
    y += 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(filename);
}
