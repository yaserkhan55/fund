import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoTarget, setInfoTarget] = useState(null);
  const [infoMessage, setInfoMessage] = useState(
    "Please provide the missing information so we can complete verification."
  );
  const [requestingInfo, setRequestingInfo] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [newCampaignsCount, setNewCampaignsCount] = useState(0);

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

      console.log(`🔄 Loading ${tab} campaigns from: ${url}`);

      const res = await fetch(url, { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}`;
        throw new Error(
          tab === "pending"
            ? `Pending campaigns couldn't be loaded. ${errorMessage}`
            : `Failed to load ${tab} campaigns: ${errorMessage}`
        );
      }

      const data = await res.json();
      
      // Handle both array response and object with campaigns property
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.campaigns)) {
        list = data.campaigns;
      } else if (data && data.success && Array.isArray(data.campaigns)) {
        list = data.campaigns;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      }
      
      // Ensure all items have required fields and normalize data
      list = list
        .filter(item => item && (item._id || item.id))
        .map(item => {
          // Normalize the item to ensure it has all required fields
          const normalized = { ...item };
          
          // Ensure _id exists
          if (!normalized._id && normalized.id) {
            normalized._id = normalized.id;
          }
          
          // Ensure owner has default values if missing
          if (!normalized.owner || (typeof normalized.owner === 'object' && !normalized.owner._id && !normalized.owner.name)) {
            normalized.owner = {
              name: "Unknown User",
              email: "unknown@user.com",
              ...(normalized.owner || {})
            };
          }
          
          // Ensure status is set
          if (!normalized.status) {
            normalized.status = tab === "pending" ? "pending" : normalized.status || "unknown";
          }
          
          return normalized;
        });
      
      // Check if new campaigns were added
      const previousCount = items.length;
      const newCount = list.length;
      
      // Debug: Log the actual campaigns data
      console.log(`📊 API Response for ${tab}:`, {
        rawData: data,
        isArray: Array.isArray(data),
        hasCampaigns: !!(data?.campaigns),
        parsedListLength: list.length
      });
      console.log(`📋 Parsed list (${list.length} items):`, list);
      if (list.length > 0) {
        console.log(`📋 First campaign:`, {
          id: list[0]._id || list[0].id,
          title: list[0].title,
          status: list[0].status,
          owner: list[0].owner
        });
        console.log(`📋 All campaign IDs:`, list.map(c => c._id || c.id));
      } else {
        console.log(`⚠️ No campaigns found in ${tab} tab`);
      }
      
      if (tab === "pending" && newCount > previousCount && previousCount > 0) {
        const newCampaigns = newCount - previousCount;
        console.log(`🆕 ${newCampaigns} new campaign(s) detected!`);
        setNewCampaignsCount(newCampaigns);
        // Show notification for 5 seconds
        setTimeout(() => setNewCampaignsCount(0), 5000);
      }
      
      console.log(`✅ Loaded ${list.length} ${tab} campaigns (was ${previousCount})`);
      console.log(`✅ Setting items state with ${list.length} campaigns`);
      setItems(list);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(`❌ Error loading ${tab} campaigns:`, err);
      setError(
        err.message ||
          (tab === "pending"
            ? "Pending campaigns couldn't be loaded. Check API /pending or server status."
            : `Failed to load ${tab} campaigns`)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  // Auto-refresh every 10 seconds when on pending tab
  useEffect(() => {
    if (activeTab !== "pending") return;

    const interval = setInterval(() => {
      console.log("Auto-refreshing pending campaigns...");
      load("pending");
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
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

  const openInfoModal = (campaign) => {
    setInfoTarget(campaign);
    setInfoMessage("Please provide the missing information so we can complete verification.");
    setInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setInfoModalOpen(false);
    setInfoTarget(null);
    setRequestingInfo(false);
  };

  const sendInfoRequest = async () => {
    if (!infoTarget?._id || !infoMessage.trim()) return;
    setRequestingInfo(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/campaigns/${infoTarget._id}/request-info`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({ message: infoMessage.trim() }),
        }
      );

      if (!res.ok) {
        throw new Error("Unable to send information request");
      }

      closeInfoModal();
      await load();
    } catch (err) {
      setError(err.message || "Unable to send information request");
    } finally {
      setRequestingInfo(false);
    }
  };

  const latestInfoRequest = (campaign) => {
    const list = Array.isArray(campaign?.infoRequests) ? campaign.infoRequests : [];
    if (!list.length) return null;
    return list[list.length - 1];
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
        onClick={() => {
          console.log("Manual refresh triggered");
          load(activeTab);
        }}
        className="ml-auto px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        title="Refresh campaigns (Auto-refreshes every 10 seconds)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
        {activeTab === "pending" && (
          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">Auto</span>
        )}
      </button>
    </div>
  );

  const isNewCampaign = (campaign) => {
    if (!campaign.createdAt) return false;
    const created = new Date(campaign.createdAt);
    const now = new Date();
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes < 30; // Show "NEW" badge for campaigns created in last 30 minutes
  };

  const Card = ({ c }) => {
    // Safety check: ensure campaign has required fields
    if (!c || (!c._id && !c.id)) {
      console.error("⚠️ Invalid campaign data:", c);
      return null;
    }

    return (
      <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
        <div className="flex gap-4">
          <img
            src={resolveImg(c.image || c.imageUrl)}
            alt={c.title || "Campaign"}
            className="w-40 h-28 object-cover rounded"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x240?text=No+Image";
            }}
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{c.title || "Untitled Campaign"}</h3>
              {isNewCampaign(c) && (
                <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{c.shortDescription || "No description"}</p>

          {c.requiresMoreInfo && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Info requested</p>
              <p>
                {latestInfoRequest(c)?.message ||
                  "Awaiting additional documents from the campaigner."}
              </p>
            </div>
          )}

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
                <button onClick={() => openInfoModal(c)} className="px-3 py-1 rounded bg-amber-600 text-white">
                  Request Info
                </button>
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
              onClick={() => window.open(`/campaign/${c._id || c.id}`, "_blank")}
              className="px-3 py-1 rounded bg-gray-200"
            >
              View
            </button>
          </div>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {newCampaignsCount > 0 && activeTab === "pending" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">🆕</span>
            <span className="font-semibold">
              {newCampaignsCount} new campaign{newCampaignsCount > 1 ? "s" : ""} detected!
            </span>
          </div>
        </div>
      )}

      <Tabs />

      {activeTab === "pending" && (
        <div className="mb-4 text-xs text-gray-500 flex items-center gap-2">
          <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
          <span>•</span>
          <span>Auto-refreshes every 10 seconds</span>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        activeTab === "pending" ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-700 bg-white">
            <p className="text-lg font-semibold">
              No pending campaigns found. Please refresh or try again.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              No pending approvals available. Everything looks updated.
            </p>
            <button
              onClick={() => load("pending")}
              className="mt-4 px-4 py-2 rounded-md bg-gray-200 text-sm"
            >
              Refresh now
            </button>
          </div>
        ) : (
          <p className="text-gray-600">No {activeTab} campaigns.</p>
        )
      ) : (
        <div>
          <div className="mb-2 text-sm text-gray-600">
            Showing {items.length} campaign{items.length !== 1 ? 's' : ''}
          </div>
          {items.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((c, index) => {
                // Debug: Log each campaign being rendered
                if (index < 2) {
                  console.log(`🎨 Rendering campaign ${index + 1}:`, {
                    id: c._id || c.id,
                    title: c.title,
                    status: c.status,
                    hasImage: !!(c.image || c.imageUrl)
                  });
                }
                return <Card key={c._id || c.id || `campaign-${index}`} c={c} />;
              })}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">
                ⚠️ Warning: API returned data but no campaigns to display. Check console for details.
              </p>
            </div>
          )}
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

      {infoModalOpen && infoTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Request Additional Information</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tell the campaigner exactly what is blocking approval so they can respond quickly.
            </p>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="Tell the campaigner what you need (e.g., upload medical documents, add patient details, etc.)"
                className="mt-1 w-full border rounded-md p-3 h-32"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeInfoModal}
                className="px-4 py-2 rounded border"
                disabled={requestingInfo}
              >
                Cancel
              </button>
              <button
                onClick={sendInfoRequest}
                className="px-4 py-2 rounded bg-amber-600 text-white"
                disabled={requestingInfo}
              >
                {requestingInfo ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
