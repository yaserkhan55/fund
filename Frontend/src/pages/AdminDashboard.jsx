import React, { useEffect, useState } from "react";

// AdminDashboard.jsx
// Single-file admin UI with tabs: Pending | Approved | Rejected
// Features: list campaigns, approve, reject, delete, edit (modal), refresh, basic error handling

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("adminToken");

  // helper: build headers
  const authHeaders = (json = true) => {
    const h = { Authorization: `Bearer ${token}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  };

  // resolve image path
  const resolveImg = (img) => {
    const FALLBACK = "https://via.placeholder.com/400x240?text=No+Image";
    if (!img) return FALLBACK;
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  // fetch list depending on tab
  const load = async (tab = activeTab) => {
    setLoading(true);
    setError("");
    try {
      let url = `${API_URL}/api/admin/pending-campaigns`;
      if (tab === "approved") url = `${API_URL}/api/admin/approved-campaigns`;
      if (tab === "rejected") url = `${API_URL}/api/admin/rejected-campaigns`;

      const res = await fetch(url, { headers: authHeaders(false) });
      if (res.status === 401) {
        setError("Unauthorized — please login again.");
        // optionally redirect
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load error:", err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // actions
  const approve = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/approve/${id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Approve failed");
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Approve failed");
    }
  };

  const reject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reject/${id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Reject failed");
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Reject failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this campaign permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/delete/${id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Delete failed");
    }
  };

  // open edit modal
  const openEdit = (item) => {
    setEditItem({ ...item });
    setShowEdit(true);
  };

  // save edit
  const saveEdit = async () => {
    if (!editItem || !editItem._id) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: editItem.title,
        shortDescription: editItem.shortDescription,
        longDescription: editItem.longDescription,
        goalAmount: editItem.goalAmount,
      };

      const res = await fetch(`${API_URL}/api/admin/edit/${editItem._id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Update failed");
      }

      setShowEdit(false);
      setEditItem(null);
      await load();
    } catch (err) {
      console.error("saveEdit error", err);
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // small components
  const Tabs = () => (
    <div className="flex gap-2 mb-4">
      {[
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "rejected", label: "Rejected" },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => setActiveTab(t.key)}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === t.key ? "bg-sky-600 text-white" : "bg-gray-100"
          }`}
        >
          {t.label}
        </button>
      ))}

      <button
        onClick={() => load(activeTab)}
        className="ml-auto px-3 py-1 rounded-md bg-gray-200"
      >
        Refresh
      </button>
    </div>
  );

  const Card = ({ c }) => (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <div className="flex gap-4">
        <img
          src={resolveImg(c.image || c.imageUrl)}
          alt={c.title}
          className="w-40 h-28 object-cover rounded"
          onError={(e) => (e.target.src = "https://via.placeholder.com/400x240?text=No+Image")}
        />

        <div className="flex-1">
          <h3 className="text-lg font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{c.shortDescription}</p>

          <div className="mt-3 flex gap-2 flex-wrap">
            {activeTab === "pending" && (
              <>
                <button
                  onClick={() => approve(c._id)}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(c._id)}
                  className="px-3 py-1 rounded bg-orange-600 text-white"
                >
                  Reject
                </button>
              </>
            )}

            {activeTab === "approved" && (
              <>
                <button
                  onClick={() => openEdit(c)}
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => remove(c._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  Delete
                </button>

                <button
                  onClick={() => reject(c._id)}
                  className="px-3 py-1 rounded bg-orange-600 text-white"
                >
                  Mark Rejected
                </button>
              </>
            )}

            {activeTab === "rejected" && (
              <>
                <button
                  onClick={() => openEdit(c)}
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => remove(c._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  Delete
                </button>

                <button
                  onClick={() => approve(c._id)}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  Mark Approved
                </button>
              </>
            )}

            <button
              onClick={() => window.open(`/campaign/${c._id}`, "_blank")}
              className="px-3 py-1 rounded bg-gray-200"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <Tabs />

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No {activeTab} campaigns.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((c) => (
            <Card key={c._id} c={c} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Edit Campaign</h2>

            <div className="grid gap-3">
              <label className="text-sm">Title</label>
              <input
                value={editItem.title || ""}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                className="border p-2 rounded"
              />

              <label className="text-sm">Short Description</label>
              <input
                value={editItem.shortDescription || ""}
                onChange={(e) => setEditItem({ ...editItem, shortDescription: e.target.value })}
                className="border p-2 rounded"
              />

              <label className="text-sm">Long Description</label>
              <textarea
                value={editItem.longDescription || ""}
                onChange={(e) => setEditItem({ ...editItem, longDescription: e.target.value })}
                className="border p-2 rounded h-28"
              />

              <label className="text-sm">Goal Amount</label>
              <input
                type="number"
                value={editItem.goalAmount || 0}
                onChange={(e) => setEditItem({ ...editItem, goalAmount: e.target.value })}
                className="border p-2 rounded"
              />
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => { setShowEdit(false); setEditItem(null); }}
                className="px-4 py-2 rounded border"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded bg-sky-600 text-white"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
