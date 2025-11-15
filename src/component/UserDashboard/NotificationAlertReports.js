import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaSave, FaTrash } from "react-icons/fa";
import { Switch } from "@headlessui/react";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    id: null,
    enable_low_stock: false,
    enable_sales_summary: false,
    enable_product_events: false,
    enable_sales_events: false,
    email_enabled: true,
    frequency: "daily",
    reporting_period: "daily", // ✅ Added
    reorder_level_threshold: 5,
    send_time: "09:00",
    preferred_day: 1,
  });

  const [loading, setLoading] = useState(false);

  const storeId = localStorage.getItem("store_id");
  const ownerId = localStorage.getItem("owner_id");

  useEffect(() => {
    async function fetchSettings() {
      if (!storeId || !ownerId) return;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("store_id", storeId)
        .eq("owner_id", ownerId)
        .single();

      if (data && !error) {
        setSettings({
          ...settings,
          ...data,
          send_time: data.send_time?.slice(0, 5) || "09:00",
          preferred_day: Number(data.preferred_day ?? 1),
          reporting_period: data.reporting_period || "daily", // ✅ safe fallback
        });
      }
    }

    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, ownerId]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    const payload = {
      ...settings,
      store_id: storeId,
      owner_id: ownerId,
      preferred_day: Number(settings.preferred_day),
      send_time:
        settings.send_time.length === 5
          ? settings.send_time
          : settings.send_time.slice(0, 5),
    };

    const { error } = await supabase
      .from("notification_settings")
      .upsert(payload, { onConflict: "store_id,owner_id" })
      .select();

    setLoading(false);

    if (!error) alert("Settings saved successfully ✅");
    else alert("Error saving settings: " + error.message);
  };

  const handleDelete = async () => {
    if (!settings.id) return;

    const confirmDelete = window.confirm("Delete notification settings?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("notification_settings")
      .delete()
      .eq("id", settings.id);

    if (!error) {
      setSettings({
        id: null,
        enable_low_stock: false,
        enable_sales_summary: false,
        enable_product_events: false,
        enable_sales_events: false,
        email_enabled: true,
        frequency: "daily",
        reporting_period: "daily", // ✅ reset
        reorder_level_threshold: 5,
        send_time: "09:00",
        preferred_day: 1,
      });
      alert("Settings deleted");
    } else alert("Error deleting settings: " + error.message);
  };

  const renderSwitch = (label, key) => (
    <Switch.Group as="div" className="flex items-center justify-between">
      <Switch.Label>{label}</Switch.Label>
      <Switch
        checked={settings[key]}
        onChange={(v) => handleChange(key, v)}
        className={`${
          settings[key] ? "bg-indigo-600" : "bg-gray-200"
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
      >
        <span
          className={`${
            settings[key] ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </Switch.Group>
  );
 
  return (
    <div className="p-6 grid gap-4">
      <div className="flex flex-col space-y-4 p-4 border  ">
        <h2 className="text-xl font-bold dark:text-white">Alert Notification Settings</h2>
        <div className="p-4 border space-y-4 rounded-lg dark:text-white">
        {renderSwitch("Email Enabled", "email_enabled")}
        {renderSwitch("Low Inventory Alerts", "enable_low_stock")}
        {renderSwitch("Sales Summary", "enable_sales_summary")}
        {renderSwitch("Product Insert/Update/Delete", "enable_product_events")}
        {renderSwitch("Sales Insert/Update/Delete", "enable_sales_events")}
        </div>
{/* </div>
        <div className="flex items-center justify-between">
          <span>Reporting Period</span>
          <select
            value={settings.reporting_period}
            onChange={(e) => handleChange("reporting_period", e.target.value)}
            className="border rounded p-1"
          >
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span>Summary Frequency</span>
          <select
            value={settings.frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
            className="border rounded p-1"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {settings.frequency === "weekly" && (
          <div className="flex items-center justify-between">
            <span>Preferred Day</span>
            <select
              value={settings.preferred_day}
              onChange={(e) =>
                handleChange("preferred_day", Number(e.target.value))
              }
              className="border rounded p-1"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Send Time</span>
          <input
            type="time"
            value={settings.send_time}
            onChange={(e) => handleChange("send_time", e.target.value)}
            className="border rounded p-1"
          />
        </div>
*/}
        <div className="flex flex-col">
          <label className="text-sm mb-1 dark:text-white">Reorder Level Threshold</label>
          <input
            type="number"
            value={settings.reorder_level_threshold}
            onChange={(e) =>
              handleChange("reorder_level_threshold", Number(e.target.value))
            }
            className="border rounded p-1"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto"
          >
            <FaSave /> Save Settings
          </button>

          {settings.id && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
            >
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
