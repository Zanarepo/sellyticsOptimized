import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaStore, FaUsers, FaUserShield, FaUserCog } from "react-icons/fa";

export default function AdminModule() {
  const [storeId, setStoreId] = useState(null);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Load store_id from localStorage
  useEffect(() => {
    const id = localStorage.getItem("store_id");
    if (id) setStoreId(Number(id));
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchUsers();
      fetchAdmins();
    }
  }, [storeId]);

  // Fetch store users
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("store_users")
      .select("id, full_name, email_address")
      .eq("store_id", storeId);

    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data || []);
    }
  };

  // Fetch admins
  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("store_admins")
      .select("admin_id, username, email, role, admin_code, created_at")
      .eq("store_id", storeId);

    if (error) {
      console.error("Error fetching admins:", error.message);
    } else {
      setAdmins(data || []);
    }
  };

  // Add admin
  const addAdmin = async (user) => {
    setLoading(true);

    const { error } = await supabase.from("store_admins").insert([
      {
        store_id: storeId,
        username: user.username,
        email: user.email_address,
        role: "admin",
        created_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Error adding admin: " + error.message);
    } else {
      fetchAdmins();
    }
  };

  // Revoke admin
  const revokeAdmin = async (adminId) => {
    setLoading(true);
    const { error } = await supabase
      .from("store_admins")
      .delete()
      .eq("admin_id", adminId);
    setLoading(false);

    if (error) {
      alert("Error revoking admin: " + error.message);
    } else {
      fetchAdmins();
    }
  };

  // Utility → Check if user is already an admin
  const isAlreadyAdmin = (username) => {
    return admins.some((a) => a.username === username);
  };

  if (!storeId) {
    return (
      <div className="p-4 text-center text-gray-600">
        <FaStore className="mx-auto text-3xl mb-2 text-gray-500" />
        <p>No <code>store_id</code> found in localStorage.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 text-2xl font-bold">
        <FaStore className="text-blue-600" />
        <h2>Manage Store Admins</h2>
      </div>

      {/* Store Users */}
      <div>
        <div className="flex items-center space-x-2 text-lg font-semibold mb-2">
          <FaUsers className="text-green-600" />
          <span>Store Users</span>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">No users found for this store.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
              >
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-sm text-gray-600">{u.email_address}</p>
                </div>
                {isAlreadyAdmin(u.username) ? (
                  <button
                    disabled
                    className="bg-gray-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed"
                  >
                    Already Admin
                  </button>
                ) : (
                  <button
                    onClick={() => addAdmin(u)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Make Admin
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Current Admins */}
      <div>
        <div className="flex items-center space-x-2 text-lg font-semibold mb-2">
          <FaUserShield className="text-purple-600" />
          <span>Current Admins</span>
        </div>
        {admins.length === 0 ? (
          <p className="text-gray-500 text-sm">No admins yet.</p>
        ) : (
          <ul className="space-y-2">
            {admins.map((a) => (
              <li
                key={a.admin_id}
                className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
              >
                <div>
                  <p className="font-medium">{a.username}</p>
                  <p className="text-sm text-gray-600">{a.email}</p>
                  <p className="text-xs text-gray-500">
                    Role: {a.role || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Code: <span className="font-mono">{a.admin_code}</span>
                  </p>
                </div>
                <button
                  onClick={() => revokeAdmin(a.admin_id)}
                  disabled={loading}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center space-x-2 text-gray-700 text-sm">
        <FaUserCog className="text-gray-600" />
        <p>Admins get a fresh 6-digit code every 24h.</p>
      </div>
    </div>
  );
}
