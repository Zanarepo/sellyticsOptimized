export default function SalesCSVExporter({ salesData, filename = "sales_report.csv" }) {
    if (!salesData) return;
  
    const header = ["Date", "Product", "Unit Price", "Qty", "Total", "Customer"];
    const rows = salesData.map((s) => [
      s.soldAt ? new Date(s.soldAt).toISOString().split("T")[0] : "",
      s.productName,
      s.unitPrice.toFixed(2),
      s.quantity,
      s.totalSales.toFixed(2),
      s.customerName || "",
    ]);
  
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
  