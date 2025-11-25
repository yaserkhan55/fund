import React, { useEffect, useState } from "react";

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

  const authHeaders = (json = true) => {
    const h = { Authorization: `Bearer ${token}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  };

  const resolveImg = (img) => {
    const FALLBACK = "https://via.placeholder.com/400x240?text=No+Image";
    if (!img) return FALLBACK;
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const load = async (tab = activeTab) => {
    setLoading(true);
    setError("");
    try {
      let url = `${API_URL}/api/admin/pending-campaigns`;
      if (tab === "approved") url = `${API_URL}/api/admin/approved-campaigns`;
      if (tab === "rejected") url = `${API_URL}/api/admin/rejected-campaigns`;

      const res = await fetch(url, { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.campaigns)
        ? data.campaigns
        : [];
      setItems(list);
    } catch (err) {
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const approve = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/approve/${id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ status: "approved" }),
      });

      if (!res.ok) throw new Error("Approve failed");
      load();
    } catch (err) {
      setError(err.message);
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
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (item) => {
    setEditItem({ ...item });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editItem?._id) return;

    setSaving(true);
    try {
      const payload = {
        title: editItem.title,
        shortDescription: editItem.shortDescription,
        fullStory: editItem.fullStory,
        goalAmount: editItem.goalAmount,
      };

      const res = await fetch(`${API_URL}/api/admin/edit/${editItem._id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      setShowEdit(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
        />

        <div className="flex-1">
          <h3 className="text-lg font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{c.shortDescription}</p>

          {(Array.isArray(c.documents) && c.documents.length > 0) ||
          (Array.isArray(c.medicalDocuments) && c.medicalDocuments.length > 0) ? (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Medical documents
              </p>
              <div className="flex gap-2 overflow-x-auto pt-2">
                {(c.documents?.length ? c.documents : c.medicalDocuments || []).map(
                  (doc, idx) => (
                    <img
                      key={`${c._id}-doc-${idx}`}
                      src={resolveImg(doc)}
                      alt="Document"
                      className="h-16 w-16 object-cover rounded border"
                    />
                  )
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex gap-2 flex-wrap">
            {activeTab === "pending" && (
              <>
                <button onClick={() => approve(c._id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                <button onClick={() => reject(c._id)} className="px-3 py-1 rounded bg-orange-600 text-white">Reject</button>
              </>
            )}

            {activeTab !== "pending" && (
              <button onClick={() => openEdit(c)} className="px-3 py-1 rounded bg-blue-600 text-white">Edit</button>
            )}

            {activeTab === "approved" && (
              <button onClick={() => reject(c._id)} className="px-3 py-1 rounded bg-orange-600 text-white">
                Mark Rejected
              </button>
            )}

            {activeTab === "rejected" && (
              <button onClick={() => approve(c._id)} className="px-3 py-1 rounded bg-green-600 text-white">
                Mark Approved
              </button>
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
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

              <label className="text-sm">Full Story</label>
              <textarea
                value={editItem.fullStory || ""}
                onChange={(e) => setEditItem({ ...editItem, fullStory: e.target.value })}
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
