import React from "react";

export default function BestHoursCard({ hours = [], locale = "en-US", timeZone = undefined }) {
  if (!hours || hours.length === 0) return null;

  // Find the hour with the highest sales
  const bestHour = hours.reduce((max, h) => (h.total > max.total ? h : max), hours[0]);

  // Convert the hour (0-23) to a formatted local time string
  const start = new Date();
  start.setHours(bestHour.hour, 0, 0, 0);

  const end = new Date(start);
  end.setHours(start.getHours() + 1);

  const formattedRange = `${start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone })} - ${end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone })}`;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
      <h3 className="font-semibold mb-2">Best Time of Day for Sales</h3>
      <p className="text-lg font-bold">
        {formattedRange} ({bestHour.total.toLocaleString()} total sales)
      </p>
    </div>
  );
}
