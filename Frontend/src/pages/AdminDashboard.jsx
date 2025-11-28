import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [contactQueries, setContactQueries] = useState([]);
  const [contactPage, setContactPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [contactPagination, setContactPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoTarget, setInfoTarget] = useState(null);
  const [infoMessage, setInfoMessage] = useState(
    "Please provide the missing information so we can complete verification."
  );
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState(null);

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

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // Load dashboard statistics
  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/admin/users`);
      url.searchParams.set("page", userPage);
      url.searchParams.set("limit", "20");
      if (userSearch) url.searchParams.set("search", userSearch);

      const res = await fetch(url, { headers: authHeaders(false) });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load contact queries
  const loadContactQueries = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/contact`);
      url.searchParams.set("page", contactPage);
      url.searchParams.set("limit", "20");
      if (contactSearch) url.searchParams.set("search", contactSearch);

      const res = await fetch(url, { headers: authHeaders(false) });
      if (!res.ok) throw new Error("Failed to load contact queries");
      const data = await res.json();
      setContactQueries(data.contacts || []);
      setContactPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const load = async (tab = activeTab) => {
    setLoading(true);
    setError("");
    try {
      let url = new URL(`${API_URL}/api/admin/pending-campaigns`);
      if (tab === "approved") url = new URL(`${API_URL}/api/admin/approved-campaigns`);
      if (tab === "rejected") url = new URL(`${API_URL}/api/admin/rejected-campaigns`);

      // Add pagination and search params
      url.searchParams.set("page", campaignPage);
      url.searchParams.set("limit", "20");
      if (campaignSearch) url.searchParams.set("search", campaignSearch);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
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
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.campaigns)) {
        list = data.campaigns;
      } else if (data && data.success && Array.isArray(data.campaigns)) {
        list = data.campaigns;
        // Update pagination if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      }

      list = list
        .filter((item) => item && (item._id || item.id))
        .map((item) => {
          const normalized = { ...item };
          if (!normalized._id && normalized.id) {
            normalized._id = normalized.id;
          }
          if (!normalized.owner || (typeof normalized.owner === "object" && !normalized.owner._id && !normalized.owner.name)) {
            normalized.owner = {
              name: "Unknown User",
              email: "unknown@user.com",
              ...(normalized.owner || {}),
            };
          }
          if (!normalized.status) {
            normalized.status = tab === "pending" ? "pending" : normalized.status || "unknown";
          }
          return normalized;
        });

      const previousCount = items.length;
      const newCount = list.length;

      if (tab === "pending" && newCount > previousCount && previousCount > 0) {
        const newCampaigns = newCount - previousCount;
        setNewCampaignsCount(newCampaigns);
        setTimeout(() => setNewCampaignsCount(0), 5000);
      }

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "dashboard") {
        loadStats();
      } else if (activeTab === "users") {
        loadUsers();
      } else if (activeTab === "contacts") {
        loadContactQueries();
      } else {
        load(activeTab);
      }
    }, campaignSearch || contactSearch ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => clearTimeout(timer);
  }, [activeTab, userPage, userSearch, campaignPage, campaignSearch, contactPage, contactSearch]);

  // Auto-refresh dashboard and pending campaigns
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "dashboard") {
        loadStats();
      } else if (activeTab === "pending") {
        load("pending");
      }
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
      if (activeTab === "dashboard") loadStats();
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
      if (activeTab === "dashboard") loadStats();
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
      const res = await fetch(`${API_URL}/api/admin/campaigns/${infoTarget._id}/request-info`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ message: infoMessage.trim() }),
      });

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

  const markRequestResolved = async (campaignId, requestId) => {
    if (!campaignId || !requestId) return;
    setResolvingRequest(requestId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/campaigns/${campaignId}/info-requests/${requestId}/resolve`,
        {
          method: "PUT",
          headers: authHeaders(true),
        }
      );

      if (!res.ok) {
        throw new Error("Unable to resolve request");
      }

      await load(activeTab);
    } catch (err) {
      setError(err.message || "Unable to resolve request");
    } finally {
      setResolvingRequest(null);
    }
  };

  const infoStatusMeta = {
    pending: { label: "Awaiting documents", badge: "bg-amber-100 text-amber-900" },
    submitted: { label: "Needs review", badge: "bg-blue-100 text-blue-900" },
    resolved: { label: "Resolved", badge: "bg-emerald-100 text-emerald-800" },
  };

  const latestInfoRequest = (campaign) => {
    const list = Array.isArray(campaign?.infoRequests) ? campaign.infoRequests : [];
    if (!list.length) return null;
    return list[list.length - 1];
  };

  const isNewCampaign = (campaign) => {
    if (!campaign.createdAt) return false;
    const created = new Date(campaign.createdAt);
    const now = new Date();
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes < 30;
  };

  // Dashboard Overview Component
  const DashboardOverview = () => {
    if (!stats) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#00B5B8]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{stats.users.total.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-xs text-[#00B5B8] mt-2">+{stats.users.newLast30Days} this month</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F9A826]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#F9A826]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{stats.campaigns.total.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Campaigns</p>
            <p className="text-xs text-[#00B5B8] mt-2">+{stats.campaigns.newLast30Days} this month</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{formatCurrency(stats.donations.totalRaised)}</h3>
            <p className="text-gray-600 text-sm">Total Raised</p>
            <p className="text-xs text-[#00B5B8] mt-2">+{formatCurrency(stats.donations.raisedLast30Days)} this month</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{stats.campaigns.pending}</h3>
            <p className="text-gray-600 text-sm">Pending Reviews</p>
            <p className="text-xs text-red-500 mt-2">Requires attention</p>
          </div>
        </div>

        {/* Campaign Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#003d3b]">Campaign Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Approved</span>
                <span className="font-bold text-green-600">{stats.campaigns.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-amber-600">{stats.campaigns.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rejected</span>
                <span className="font-bold text-red-600">{stats.campaigns.rejected}</span>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <h3 className="text-lg font-semibold text-[#003d3b] mb-4">Recent Users</h3>
            <div className="space-y-3">
              {stats.recent.users.length > 0 ? (
                stats.recent.users.map((user, idx) => (
                  <div key={user._id || idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[#003d3b]">{user.name || "Unknown"}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent users</p>
              )}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <h3 className="text-lg font-semibold text-[#003d3b] mb-4">Recent Campaigns</h3>
            <div className="space-y-3">
              {stats.recent.campaigns.length > 0 ? (
                stats.recent.campaigns.map((campaign, idx) => (
                  <div key={campaign._id || idx} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-[#003d3b] line-clamp-1">{campaign.title}</p>
                      <p className="text-gray-500 text-xs">
                        {campaign.owner?.name || "Unknown"} • {campaign.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent campaigns</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Users Management Component
  const UsersManagement = () => {
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              className="flex-1 px-4 py-2 border border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
            />
            <button
              onClick={() => loadUsers()}
              className="px-6 py-2 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2] hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-[#00B5B8]/10 rounded-full flex items-center justify-center">
                        <span className="text-[#00B5B8] font-bold text-lg">
                          {(user.name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#003d3b]">{user.name || "Unknown User"}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-600">Provider: </span>
                        <span className="font-semibold text-[#003d3b] capitalize">{user.provider || "local"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Joined: </span>
                        <span className="font-semibold text-[#003d3b]">{formatDate(user.createdAt)}</span>
                      </div>
                      {user.stats && (
                        <>
                          <div>
                            <span className="text-gray-600">Campaigns: </span>
                            <span className="font-semibold text-[#003d3b]">{user.stats.campaignsCount || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Raised: </span>
                            <span className="font-semibold text-[#003d3b]">
                              {formatCurrency(user.stats.totalRaised || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-[#E0F2F2]">
            <p className="text-gray-600">No users found</p>
          </div>
        )}
      </div>
    );
  };

  // Campaign Card Component (keeping existing logic)
  const Card = ({ c }) => {
    if (!c || (!c._id && !c.id)) {
      return null;
    }

    return (
      <div className="border rounded-2xl p-6 shadow-lg bg-white hover:shadow-xl transition border-[#E0F2F2]">
        <div className="flex gap-4">
          <img
            src={resolveImg(c.image || c.imageUrl)}
            alt={c.title || "Campaign"}
            className="w-40 h-28 object-cover rounded-xl"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x240?text=No+Image";
            }}
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-[#003d3b]">{c.title || "Untitled Campaign"}</h3>
              {isNewCampaign(c) && (
                <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{c.shortDescription || "No description"}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span>Owner: {c.owner?.name || "Unknown"}</span>
              <span>•</span>
              <span>{formatDate(c.createdAt)}</span>
            </div>

            {Array.isArray(c.infoRequests) && c.infoRequests.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-[#003d3b]">
                <p className="font-semibold text-[#8B5E00] mb-2">Verification inbox</p>
                <div className="space-y-3">
                  {c.infoRequests.map((req, idx) => {
                    const meta = infoStatusMeta[req.status] || infoStatusMeta.pending;
                    return (
                      <div
                        key={req._id || `${c._id}-req-${idx}`}
                        className="rounded-2xl border border-white bg-white/90 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-[#003d3b]">{req.message}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested {req.createdAt ? formatDate(req.createdAt) : "recently"}
                        </p>

                        {Array.isArray(req.responses) && req.responses.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {req.responses.map((resp, respIdx) => (
                              <div
                                key={`${req._id || idx}-resp-${respIdx}`}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-2"
                              >
                                <p className="text-xs text-gray-600">
                                  {resp.uploadedByName || "Campaigner"} uploaded{" "}
                                  {resp.documents?.length || 0} file(s)
                                  {resp.uploadedAt ? ` · ${formatDate(resp.uploadedAt)}` : ""}
                                </p>
                                {resp.note && <p className="mt-1 text-xs text-gray-700">{resp.note}</p>}
                                {Array.isArray(resp.documents) && resp.documents.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {resp.documents.map((doc, docIdx) => (
                                      <a
                                        key={`${req._id || idx}-resp-${respIdx}-doc-${docIdx}`}
                                        href={resolveImg(doc)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-semibold text-sky-700 hover:border-sky-400"
                                      >
                                        View file {docIdx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {req.status !== "resolved" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => markRequestResolved(c._id, req._id)}
                              disabled={resolvingRequest === req._id}
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {resolvingRequest === req._id ? "Marking..." : "Mark resolved"}
                            </button>
                            <button
                              onClick={() => openInfoModal(c)}
                              className="rounded-md border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Request update
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(Array.isArray(c.documents) && c.documents.length > 0) ||
            (Array.isArray(c.medicalDocuments) && c.medicalDocuments.length > 0) ? (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Medical documents</p>
                <div className="flex gap-2 overflow-x-auto pt-2">
                  {(c.documents?.length ? c.documents : c.medicalDocuments || []).map((doc, idx) => (
                    <img
                      key={`${c._id}-doc-${idx}`}
                      src={resolveImg(doc)}
                      alt="Document"
                      className="h-16 w-16 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex gap-2 flex-wrap">
              {activeTab === "pending" && (
                <>
                  <button
                    onClick={() => approve(c._id)}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(c._id)}
                    className="px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openInfoModal(c)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                  >
                    Request Info
                  </button>
                </>
              )}

              {activeTab === "approved" && (
                <>
                  <button
                    onClick={() => reject(c._id)}
                    className="px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
                  >
                    Mark Rejected
                  </button>
                  <button
                    onClick={() => openInfoModal(c)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                  >
                    Request Info
                  </button>
                </>
              )}

              {activeTab === "rejected" && (
                <>
                  <button
                    onClick={() => approve(c._id)}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                  >
                    Mark Approved
                  </button>
                  <button
                    onClick={() => openInfoModal(c)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                  >
                    Request Info
                  </button>
                </>
              )}

              {activeTab !== "pending" && (
                <button
                  onClick={() => openEdit(c)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Edit
                </button>
              )}

              <button
                onClick={() => window.open(`/campaign/${c._id || c.id}`, "_blank")}
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tabs Component
  const Tabs = () => (
    <div className="flex gap-2 mb-6 flex-wrap">
      {[
        { key: "dashboard", label: "Dashboard", icon: "📊" },
        { key: "pending", label: "Pending", icon: "⏳" },
        { key: "approved", label: "Approved", icon: "✅" },
        { key: "rejected", label: "Rejected", icon: "❌" },
        { key: "users", label: "Users", icon: "👥" },
        { key: "contacts", label: "Contact Queries", icon: "📧" },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => {
            setActiveTab(t.key);
            setCampaignPage(1);
            setCampaignSearch("");
            setContactPage(1);
            setContactSearch("");
          }}
          className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === t.key
              ? "bg-[#00B5B8] text-white shadow-lg"
              : "bg-white text-[#003d3b] border border-[#E0F2F2] hover:bg-[#E6F7F7]"
          }`}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}

      <button
        onClick={() => {
          if (activeTab === "dashboard") {
            loadStats();
          } else {
            load(activeTab);
          }
        }}
        className="ml-auto px-6 py-3 rounded-xl bg-[#00B5B8] text-white font-semibold hover:bg-[#009EA1] transition flex items-center gap-2"
        title="Refresh (Auto-refreshes every 10 seconds)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
        {activeTab === "pending" && (
          <span className="text-xs bg-[#009EA1] px-2 py-0.5 rounded">Auto</span>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1FAFA] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#003d3b] mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage campaigns, users, and platform statistics</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                navigate("/admin/login");
              }}
              className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {newCampaignsCount > 0 && activeTab === "pending" && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">🆕</span>
                <span className="font-semibold">
                  {newCampaignsCount} new campaign{newCampaignsCount > 1 ? "s" : ""} detected!
                </span>
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
              <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
              <span>•</span>
              <span>Auto-refreshes every 10 seconds</span>
            </div>
          )}
        </div>

        <Tabs />

        {/* Content */}
        {activeTab === "dashboard" && <DashboardOverview />}
        {activeTab === "users" && <UsersManagement />}
        {activeTab === "contacts" && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, email, or query..."
                    value={contactSearch}
                    onChange={(e) => {
                      setContactSearch(e.target.value);
                      setContactPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8]"
                  />
                </div>
                <button
                  onClick={() => {
                    setContactSearch("");
                    setContactPage(1);
                    loadContactQueries();
                  }}
                  className="px-6 py-3 bg-gray-100 text-[#003d3b] font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Contact Queries List */}
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contact queries...</p>
              </div>
            ) : contactQueries.length > 0 ? (
              <div className="space-y-4">
                {contactQueries.map((query) => (
                  <div
                    key={query._id}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2] hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-[#00B5B8]/10 rounded-full flex items-center justify-center">
                            <span className="text-[#00B5B8] font-bold text-lg">
                              {(query.name || "U")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#003d3b]">{query.name || "Anonymous"}</h3>
                            <p className="text-sm text-gray-600">{query.email || "No email provided"}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-[#003d3b] mb-1">Query:</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{query.query}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>📅 {formatDate(query.createdAt)}</span>
                          <span
                            className={`px-3 py-1 rounded-full font-semibold ${
                              query.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : query.status === "archived"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {query.status || "pending"}
                          </span>
                        </div>
                        {query.adminResponse && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Admin Response:</p>
                            <p className="text-sm text-blue-900">{query.adminResponse}</p>
                            {query.respondedAt && (
                              <p className="text-xs text-blue-600 mt-1">
                                Responded on {formatDate(query.respondedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {query.status !== "resolved" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/contact/${query._id}`, {
                                method: "PUT",
                                headers: authHeaders(true),
                                body: JSON.stringify({ status: "resolved" }),
                              });
                              if (!res.ok) throw new Error("Failed to resolve");
                              loadContactQueries();
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {query.status !== "archived" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/contact/${query._id}`, {
                                method: "PUT",
                                headers: authHeaders(true),
                                body: JSON.stringify({ status: "archived" }),
                              });
                              if (!res.ok) throw new Error("Failed to archive");
                              loadContactQueries();
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                          className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-sm"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No contact queries found</p>
              </div>
            )}

            {/* Pagination */}
            {contactPagination.pages > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((contactPagination.page - 1) * contactPagination.limit) + 1} to{" "}
                    {Math.min(contactPagination.page * contactPagination.limit, contactPagination.total)} of{" "}
                    {contactPagination.total} queries
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (contactPage > 1) {
                          setContactPage(contactPage - 1);
                        }
                      }}
                      disabled={contactPage === 1}
                      className="px-4 py-2 rounded-lg border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-[#E6F7F7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, contactPagination.pages) }, (_, i) => {
                        let pageNum;
                        if (contactPagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (contactPage <= 3) {
                          pageNum = i + 1;
                        } else if (contactPage >= contactPagination.pages - 2) {
                          pageNum = contactPagination.pages - 4 + i;
                        } else {
                          pageNum = contactPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setContactPage(pageNum)}
                            className={`px-3 py-2 rounded-lg font-semibold transition ${
                              contactPage === pageNum
                                ? "bg-[#00B5B8] text-white"
                                : "border border-[#E0F2F2] text-[#003d3b] hover:bg-[#E6F7F7]"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        if (contactPage < contactPagination.pages) {
                          setContactPage(contactPage + 1);
                        }
                      }}
                      disabled={contactPage === contactPagination.pages}
                      className="px-4 py-2 rounded-lg border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-[#E6F7F7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {(activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title, beneficiary, city, category..."
                    value={campaignSearch}
                    onChange={(e) => {
                      setCampaignSearch(e.target.value);
                      setCampaignPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8]"
                  />
                </div>
                <button
                  onClick={() => {
                    setCampaignSearch("");
                    setCampaignPage(1);
                    load(activeTab);
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-[#E6F7F7] transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-[#E0F2F2]">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-[#E0F2F2]">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  No {activeTab} campaigns found.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {activeTab === "pending"
                    ? "All campaigns have been reviewed."
                    : `No ${activeTab} campaigns at this time.`}
                </p>
                <button
                  onClick={() => load(activeTab)}
                  className="px-6 py-2 rounded-xl bg-[#00B5B8] text-white font-semibold hover:bg-[#009EA1] transition"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E0F2F2] overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#E6F7F7] border-b-2 border-[#00B5B8]">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Campaign</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">User</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Category</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Goal</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Raised</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Status</th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-[#003d3b]">Created</th>
                        <th className="px-4 py-4 text-center text-sm font-bold text-[#003d3b]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((c, index) => {
                        const owner = c.owner || {};
                        const ownerName = typeof owner === "object" ? owner.name : owner || "Unknown";
                        const ownerEmail = typeof owner === "object" ? owner.email : "";
                        const raised = Number(c.raisedAmount || 0);
                        const goal = Number(c.goalAmount || 0);
                        const percentage = goal > 0 ? Math.round((raised / goal) * 100) : 0;
                        const statusColor =
                          c.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : c.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800";

                        return (
                          <tr key={c._id || c.id || `campaign-${index}`} className="hover:bg-[#F1FAFA] transition">
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <img
                                  src={resolveImg(c.image || c.imageUrl)}
                                  alt={c.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/64x64?text=No+Image";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[#003d3b] line-clamp-1">{c.title || "Untitled"}</p>
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {c.shortDescription || "No description"}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Beneficiary: {c.beneficiaryName || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-[#003d3b] text-sm">{ownerName}</p>
                                <p className="text-xs text-gray-500">{ownerEmail || "No email"}</p>
                                {owner.provider && (
                                  <p className="text-xs text-gray-400 mt-1 capitalize">
                                    {owner.provider}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-2 py-1 rounded">
                                {c.category || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-[#003d3b]">
                                ₹{goal.toLocaleString("en-IN")}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-[#00B5B8]">
                                  ₹{raised.toLocaleString("en-IN")}
                                </p>
                                <p className="text-xs text-gray-500">{percentage}%</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor}`}>
                                {c.status || "pending"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs text-gray-600">
                                {c.createdAt
                                  ? new Date(c.createdAt).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                {activeTab === "pending" && (
                                  <>
                                    <button
                                      onClick={() => approve(c._id)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => reject(c._id)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => openInfoModal(c)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                                    >
                                      Request Info
                                    </button>
                                  </>
                                )}
                                {activeTab === "approved" && (
                                  <>
                                    <button
                                      onClick={() => reject(c._id)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => openInfoModal(c)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                                    >
                                      Request Info
                                    </button>
                                  </>
                                )}
                                {activeTab === "rejected" && (
                                  <>
                                    <button
                                      onClick={() => approve(c._id)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => openInfoModal(c)}
                                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                                    >
                                      Request Info
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => openEdit(c)}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => window.open(`/campaign/${c._id || c.id}`, "_blank")}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-[#E0F2F2] flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                      {pagination.total} campaigns
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (campaignPage > 1) {
                            setCampaignPage(campaignPage - 1);
                          }
                        }}
                        disabled={campaignPage === 1}
                        className="px-4 py-2 rounded-lg border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-[#E6F7F7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (campaignPage <= 3) {
                            pageNum = i + 1;
                          } else if (campaignPage >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = campaignPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCampaignPage(pageNum)}
                              className={`px-3 py-2 rounded-lg font-semibold transition ${
                                campaignPage === pageNum
                                  ? "bg-[#00B5B8] text-white"
                                  : "border border-[#E0F2F2] text-[#003d3b] hover:bg-[#E6F7F7]"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          if (campaignPage < pagination.pages) {
                            setCampaignPage(campaignPage + 1);
                          }
                        }}
                        disabled={campaignPage === pagination.pages}
                        className="px-4 py-2 rounded-lg border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-[#E6F7F7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
            <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-2xl">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-4">Edit Campaign</h2>

              <div className="grid gap-4">
                <label className="text-sm font-semibold text-[#003d3b]">Title</label>
                <input
                  value={editItem.title || ""}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  className="border border-[#E0F2F2] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
                />

                <label className="text-sm font-semibold text-[#003d3b]">Short Description</label>
                <input
                  value={editItem.shortDescription || ""}
                  onChange={(e) => setEditItem({ ...editItem, shortDescription: e.target.value })}
                  className="border border-[#E0F2F2] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
                />

                <label className="text-sm font-semibold text-[#003d3b]">Full Story</label>
                <textarea
                  value={editItem.fullStory || ""}
                  onChange={(e) => setEditItem({ ...editItem, fullStory: e.target.value })}
                  className="border border-[#E0F2F2] p-3 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
                />

                <label className="text-sm font-semibold text-[#003d3b]">Goal Amount</label>
                <input
                  type="number"
                  value={editItem.goalAmount || 0}
                  onChange={(e) => setEditItem({ ...editItem, goalAmount: e.target.value })}
                  className="border border-[#E0F2F2] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
                />
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEdit(false);
                    setEditItem(null);
                  }}
                  className="px-6 py-2 rounded-xl border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-gray-50 transition"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  onClick={saveEdit}
                  className="px-6 py-2 rounded-xl bg-[#00B5B8] text-white font-semibold hover:bg-[#009EA1] transition"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Request Modal */}
        {infoModalOpen && infoTarget && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
            <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-2">Request Additional Information</h2>
              <p className="text-sm text-gray-600 mb-4">
                Tell the campaigner exactly what is blocking approval so they can respond quickly.
              </p>

              <div className="mb-4">
                <label className="text-sm font-semibold text-[#003d3b]">Message</label>
                <textarea
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  placeholder="Tell the campaigner what you need (e.g., upload medical documents, add patient details, etc.)"
                  className="mt-1 w-full border border-[#E0F2F2] rounded-xl p-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#00B5B8]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeInfoModal}
                  className="px-6 py-2 rounded-xl border border-[#E0F2F2] text-[#003d3b] font-semibold hover:bg-gray-50 transition"
                  disabled={requestingInfo}
                >
                  Cancel
                </button>
                <button
                  onClick={sendInfoRequest}
                  className="px-6 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                  disabled={requestingInfo}
                >
                  {requestingInfo ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
