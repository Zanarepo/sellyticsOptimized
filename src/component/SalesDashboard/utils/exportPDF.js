// src/components/SalesDashboard/utils/exportPDF.js
import jsPDF from "jspdf";

export function exportPDF(
  rows = [],
  columns,
  filename = `report_${new Date().toISOString().slice(0, 10)}.pdf`
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn("No data to export.");
    return;
  }

  // Ensure columns is always an array
  if (!Array.isArray(columns)) {
    const firstRow = rows[0] || {};
    columns = Object.keys(firstRow).map((key) => ({
      key,
      label: key
        .replace(/([A-Z])/g, " $1") // split camelCase
        .replace(/^./, (str) => str.toUpperCase()), // capitalize
    }));
  }

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  const lineHeight = 14;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let y = margin;

  // Title
  doc.setFontSize(16);
  doc.text("Sales Report", margin, y);
  y += 20;
  doc.setFontSize(10);

  // Column widths
  const colWidths = [];
  const defaultColWidth = Math.max(60, (pageWidth - margin * 2) / columns.length);
  for (let i = 0; i < columns.length; i++) colWidths.push(defaultColWidth);

  const renderRow = (cells) => {
    let x = margin;
    let rowHeight = lineHeight;

    for (let i = 0; i < cells.length; i++) {
      const text = cells[i] === undefined || cells[i] === null ? "" : String(cells[i]);
      const wrapped = doc.splitTextToSize(text, colWidths[i] - 4);
      doc.text(wrapped, x + 2, y);
      rowHeight = Math.max(rowHeight, wrapped.length * lineHeight);
      x += colWidths[i];
    }

    y += rowHeight + 4;
  };

  // Header row
  renderRow(columns.map((c) => c.label));

  // Rows
  for (const r of rows) {
    const cells = columns.map((c) => {
      const keyParts = c.key.split(".");
      let value = r;
      for (const part of keyParts) {
        if (value == null) break;
        value = value[part];
      }
      return value;
    });

    // Page break
    if (y + 40 > pageHeight) {
      doc.addPage();
      y = margin;
      renderRow(columns.map((c) => c.label)); // repeat header
    }

    renderRow(cells);
  }

  doc.save(filename);
}
