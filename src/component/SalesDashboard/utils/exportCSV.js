// src/components/SalesDashboard/utils/exportCSV.js
function flattenObj(obj, prefix = "") {
    return Object.keys(obj).reduce((acc, key) => {
      const val = obj[key];
      const pref = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
        Object.assign(acc, flattenObj(val, pref));
      } else {
        acc[pref] = val;
      }
      return acc;
    }, {});
  }
  
  export function exportCSV(rows = [], filename = `report_${new Date().toISOString().slice(0,10)}.csv`) {
    if (!Array.isArray(rows) || rows.length === 0) {
      const blob = new Blob([""], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      return;
    }
  
    // build header set
    const flatRows = rows.map(r => flattenObj(r));
    const headers = Array.from(
      flatRows.reduce((set, r) => {
        Object.keys(r).forEach(k => set.add(k));
        return set;
      }, new Set())
    );
  
    const escapeCell = (v) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "string" ? v : String(v);
      // escape quotes by doubling them; wrap in quotes if contains comma/newline/quote
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
  
    const lines = [headers.join(",")];
    for (const r of flatRows) {
      const row = headers.map(h => escapeCell(r[h] ?? ""));
      lines.push(row.join(","));
    }
  
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  