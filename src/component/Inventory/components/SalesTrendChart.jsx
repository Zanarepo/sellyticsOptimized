// SalesTrendChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = ["#6366F1", "#8B5CF6", "#A78BFA", "#C4B5FD"];

export default function SalesTrendChart({ data = [] }) {
  if (!data || data.length === 0)
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500">No sales data available</p>
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#666"
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#fff", 
            border: "1px solid #ddd",
            borderRadius: "8px"
          }}
          labelStyle={{ color: "#333", fontWeight: "bold" }}
        />
        <Bar dataKey="qty" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}