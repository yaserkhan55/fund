import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function CreatorDashboard() {
  const { isSignedIn, getToken } = useAuth();
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [responseModal, setResponseModal] = useState(null);
  const [responseFiles, setResponseFiles] = useState([]);
  const [responseNote, setResponseNote] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");
  const popupShownRef = useRef(false);

  const resolveAuthToken = useCallback(async () => {
    let authToken = null;
    try {
      authToken = await getToken();
    } catch (error) {
      authToken = localStorage.getItem("token");
    }
    return authToken;
  }, [getToken]);

  // Fetch campaigns with auto-refresh
  useEffect(() => {
    if (!isSignedIn) {
      setMyCampaigns([]);
      setLoading(false);
      return;
    }

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const authToken = await resolveAuthToken();
        if (!authToken) {
          setMyCampaigns([]);
          return;
        }

        const res = await axios.get(`${API_URL}/api/campaigns/my`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
        setMyCampaigns(list);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setMyCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCampaigns, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, resolveAuthToken]);

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;
    const base = import.meta.env.VITE_API_URL;
    return `${base}/${img.replace(/^\/+/, "")}`;
  };

  const adminRequests = useMemo(() => {
    if (!Array.isArray(myCampaigns)) return [];
    return myCampaigns.flatMap((campaign) => {
      if (!Array.isArray(campaign.infoRequests)) return [];
      return campaign.infoRequests
        .filter((req) => req.status === "pending")
        .map((req) => ({
          ...req,
          campaignId: campaign._id,
          campaignTitle: campaign.title,
        }));
    });
  }, [myCampaigns]);

  const verificationQueue = useMemo(() => {
    if (!Array.isArray(myCampaigns)) return [];
    return myCampaigns.flatMap((campaign) => {
      if (!Array.isArray(campaign.infoRequests)) return [];
      return campaign.infoRequests
        .filter((req) => req.status !== "resolved")
        .map((req) => ({
          ...req,
          campaignId: campaign._id,
          campaignTitle: campaign.title,
          campaign,
        }));
    });
  }, [myCampaigns]);

  const hasCampaigns = Array.isArray(myCampaigns) && myCampaigns.length > 0;

  // Comprehensive metrics
  const metrics = useMemo(() => {
    if (!hasCampaigns) {
      return {
        totalCampaigns: 0,
        totalRaised: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        awaitingDocuments: verificationQueue.length,
        avgTicket: 0,
        newIn30Days: 0,
        totalGoal: 0,
        completionRate: 0,
      };
    }

    const totalRaised = myCampaigns.reduce(
      (sum, campaign) => sum + (Number(campaign.raisedAmount) || 0),
      0
    );
    const totalGoal = myCampaigns.reduce(
      (sum, campaign) => sum + (Number(campaign.goalAmount) || 0),
      0
    );
    const approved = myCampaigns.filter((c) => c.status === "approved").length;
    const rejected = myCampaigns.filter((c) => c.status === "rejected").length;
    const pending = myCampaigns.filter(
      (c) => c.status !== "approved" && c.status !== "rejected"
    ).length;
    const awaitingDocuments = verificationQueue.length;
    const avgTicket = approved > 0 ? Math.round(totalRaised / approved) : 0;
    const completionRate = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newIn30Days = myCampaigns.filter((c) => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt) >= thirtyDaysAgo;
    }).length;

    return {
      totalCampaigns: myCampaigns.length,
      totalRaised,
      totalGoal,
      approved,
      pending,
      rejected,
      awaitingDocuments,
      avgTicket,
      newIn30Days,
      completionRate,
    };
  }, [myCampaigns, verificationQueue, hasCampaigns]);

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    if (!hasCampaigns) return [];
    const query = campaignSearch.trim().toLowerCase();

    let filtered = [...myCampaigns];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((c) => {
        if (filterStatus === "pending") {
          return c.status !== "approved" && c.status !== "rejected";
        }
        return c.status === filterStatus;
      });
    }

    // Filter by search
    if (query) {
      filtered = filtered.filter((campaign) => {
        const title = campaign.title?.toLowerCase() || "";
        const category = campaign.category?.toLowerCase() || "";
        const description = campaign.shortDescription?.toLowerCase() || "";
        return title.includes(query) || category.includes(query) || description.includes(query);
      });
    }

    // Sort by most recent activity
    return filtered.sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [myCampaigns, campaignSearch, filterStatus, hasCampaigns]);

  // Activity feed
  const activityFeed = useMemo(() => {
    if (!hasCampaigns) return [];
    const events = [];

    myCampaigns.forEach((campaign) => {
      // Status changes
      if (campaign.status) {
        events.push({
          id: `${campaign._id}-status`,
          label: `${campaign.title} is ${campaign.status || "pending"}`,
          detail: `Goal ₹${Number(campaign.goalAmount || 0).toLocaleString("en-IN")}`,
          time: campaign.updatedAt || campaign.createdAt,
          tone:
            campaign.status === "approved"
              ? "success"
              : campaign.status === "rejected"
              ? "danger"
              : "warning",
        });
      }

      // Info requests
      if (Array.isArray(campaign.infoRequests)) {
        campaign.infoRequests.forEach((req) => {
          events.push({
            id: `${campaign._id}-req-${req._id}`,
            label: `Info requested · ${campaign.title}`,
            detail: req.message,
            time: req.createdAt,
            tone: req.status === "resolved" ? "success" : "info",
          });

          if (Array.isArray(req.responses)) {
            req.responses.forEach((resp, idx) => {
              events.push({
                id: `${campaign._id}-resp-${req._id}-${idx}`,
                label: `Documents uploaded · ${campaign.title}`,
                detail: resp.note || "Files submitted",
                time: resp.uploadedAt,
                tone: "neutral",
              });
            });
          }
        });
      }

      // Admin actions
      if (Array.isArray(campaign.adminActions)) {
        campaign.adminActions.forEach((action, idx) => {
          events.push({
            id: `${campaign._id}-action-${idx}`,
            label: `Admin ${action.action}`,
            detail: `${campaign.title} • ${action.message || ""}`,
            time: action.createdAt,
            tone: action.action === "approved" ? "success" : "danger",
          });
        });
      }
    });

    return events
      .filter((event) => event.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  }, [myCampaigns, hasCampaigns]);

  const requestStatusStyles = {
    pending: {
      label: "Action required",
      badge: "bg-amber-100 text-amber-900",
      pill: "bg-amber-500/10 text-amber-700 border-amber-200",
    },
    submitted: {
      label: "Under review",
      badge: "bg-blue-100 text-blue-900",
      pill: "bg-blue-500/10 text-blue-700 border-blue-200",
    },
    resolved: {
      label: "Resolved",
      badge: "bg-emerald-100 text-emerald-800",
      pill: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
  };

  const formatRequestTime = (date) => {
    if (!date) return "Just now";
    const created = new Date(date);
    const diff = Date.now() - created.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatFullDate = (date) => {
    if (!date) return "Just now";
    return new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const openRespondModal = (campaign, request) => {
    setResponseModal({ campaign, request });
    setResponseFiles([]);
    setResponseNote("");
    setResponseError("");
  };

  const closeRespondModal = () => {
    setResponseModal(null);
    setResponseFiles([]);
    setResponseNote("");
    setResponseError("");
  };

  const handleFileInput = (event) => {
    const files = Array.from(event.target.files || []);
    setResponseFiles(files);
  };

  const removeResponseFile = (index) => {
    setResponseFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const fileLabel = (path) => {
    if (!path) return "document";
    return path.split("/").pop();
  };

  const handleResponseSubmit = async () => {
    if (!responseModal) return;

    if (!responseFiles.length && !responseNote.trim()) {
      setResponseError("Upload at least one document or add a note for the admin.");
      return;
    }

    setSubmittingResponse(true);
    setResponseError("");

    try {
      const authToken = await resolveAuthToken();
      if (!authToken) {
        setResponseError("Please sign in again to upload documents.");
        return;
      }

      const formData = new FormData();
      responseFiles.forEach((file) => formData.append("documents", file));
      if (responseNote.trim()) {
        formData.append("note", responseNote.trim());
      }

      const res = await axios.post(
        `${API_URL}/api/campaigns/${responseModal.campaign._id}/info-requests/${responseModal.request._id}/respond`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const updatedCampaign = res.data?.campaign;
      if (updatedCampaign?._id) {
        setMyCampaigns((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((campaign) =>
            campaign._id === updatedCampaign._id ? updatedCampaign : campaign
          );
        });
      }

      closeRespondModal();
    } catch (err) {
      console.error("Respond request error:", err);
      setResponseError(
        err.response?.data?.message || "Failed to upload documents. Please try again."
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const openRequestPopup = (request) => {
    setActiveRequest(request);
    setShowRequestPopup(true);
  };

  useEffect(() => {
    if (!loading && adminRequests.length > 0 && !popupShownRef.current) {
      setActiveRequest(adminRequests[0]);
      setShowRequestPopup(true);
      popupShownRef.current = true;
    }
  }, [loading, adminRequests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003d3b] font-semibold">Syncing your dashboard...</p>
          <p className="text-sm text-gray-500">Preparing live campaign metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1FAFA] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#E6F7F7] via-white to-[#FEF6E6] border border-[#E0F2F2] rounded-3xl p-6 lg:p-10 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-[0.4em] text-[#00B5B8] uppercase">
                Creator workspace
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#003d3b] mt-2">
                My Campaign Dashboard
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Monitor every fundraiser, respond to admin checks, and keep your supporters updated
                in one command centre.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="bg-white/80 border border-white rounded-2xl px-5 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Live campaigns</p>
                  <p className="text-2xl font-bold text-[#003d3b]">{metrics.approved}</p>
                </div>
                <div className="bg-white/80 border border-white rounded-2xl px-5 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Pending review</p>
                  <p className="text-2xl font-bold text-[#F9A826]">{metrics.pending}</p>
                </div>
                <div className="bg-white/80 border border-white rounded-2xl px-5 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Raised overall</p>
                  <p className="text-2xl font-bold text-[#00B5B8]">
                    {formatCurrency(metrics.totalRaised)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to="/create-campaign"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#00B5B8] px-5 py-3 text-white font-semibold shadow hover:bg-[#009EA1] transition"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Launch new campaign
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#00B5B8] px-5 py-3 text-[#00B5B8] font-semibold hover:bg-[#E6F7F7] transition"
                >
                  View playbook
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-auto lg:min-w-[280px]">
              <div className="bg-white rounded-2xl border border-[#E0F2F2] shadow-inner p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Last 30 days</p>
                    <p className="text-lg font-bold text-[#003d3b]">{metrics.newIn30Days}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#00B5B8]/10 text-[#00B5B8] font-semibold">
                    New launches
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Average per campaign</p>
                  <p className="text-2xl font-bold text-[#003d3b]">
                    {formatCurrency(metrics.avgTicket)}
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-[#E0F2F2]">
                  <p className="text-xs uppercase text-gray-500">Pipeline health</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Approved</span>
                    <span className="font-semibold text-green-600">{metrics.approved}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Pending</span>
                    <span className="font-semibold text-amber-600">{metrics.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Rejected</span>
                    <span className="font-semibold text-red-600">{metrics.rejected}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Alerts */}
        {adminRequests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#003d3b] mb-1">Action Required</h3>
                <p className="text-gray-700 mb-3">
                  Admin needs more information for {adminRequests.length} campaign
                  {adminRequests.length > 1 ? "s" : ""}. Respond quickly to get your campaigns
                  approved.
                </p>
                <button
                  onClick={() => openRequestPopup(adminRequests[0])}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00B5B8] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#009EA1] transition"
                >
                  View requests
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#00B5B8]/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#00B5B8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">
              {metrics.totalCampaigns}
            </h3>
            <p className="text-gray-600 text-sm">Total Campaigns</p>
            <p className="text-xs text-[#00B5B8] mt-2">+{metrics.newIn30Days} this month</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">
              {formatCurrency(metrics.totalRaised)}
            </h3>
            <p className="text-gray-600 text-sm">Total Raised</p>
            <p className="text-xs text-[#00B5B8] mt-2">
              {metrics.completionRate}% of goal
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F9A826]/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#F9A826]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{metrics.pending}</h3>
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-xs text-amber-600 mt-2">Requires attention</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#003d3b] mb-1">{metrics.approved}</h3>
            <p className="text-gray-600 text-sm">Live Campaigns</p>
            <p className="text-xs text-green-600 mt-2">Active now</p>
          </div>
        </div>

        {/* Search and Filter */}
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
                placeholder="Search campaigns by title, category, or description..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {["all", "approved", "pending", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-xl font-semibold transition ${
                    filterStatus === status
                      ? "bg-[#00B5B8] text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {filteredCampaigns.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">
              Showing {filteredCampaigns.length} of {myCampaigns.length} campaigns
            </p>
          )}
        </div>

        {/* Campaigns Grid */}
        {!hasCampaigns ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
            <div className="w-20 h-20 bg-[#E6F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-[#00B5B8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#003d3b] mb-2">No Campaigns Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start your first fundraising campaign and make a real difference in people's lives
            </p>
            <Link
              to="/create-campaign"
              className="inline-flex items-center gap-2 bg-[#00B5B8] hover:bg-[#009EA1] text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Campaign
            </Link>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
            <p className="text-gray-600">No campaigns match your search criteria.</p>
            <button
              onClick={() => {
                setCampaignSearch("");
                setFilterStatus("all");
              }}
              className="mt-4 text-[#00B5B8] font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((c) => {
              const raised = Number(c.raisedAmount || 0);
              const goal = Math.max(1, Number(c.goalAmount || 0));
              const percentage = Math.min(100, Math.round((raised / goal) * 100));
              const status = c.status === "approved" ? "Approved" : c.status === "rejected" ? "Rejected" : "Pending";
              const statusColor =
                c.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : c.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800";
              const pendingRequest = Array.isArray(c.infoRequests)
                ? c.infoRequests.find((req) => req.status !== "resolved")
                : null;
              const requestMeta = pendingRequest
                ? requestStatusStyles[pendingRequest.status] || requestStatusStyles.pending
                : null;

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E0F2F2] flex flex-col hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="h-48 w-full overflow-hidden bg-gray-200 relative">
                    <img
                      src={resolveImg(c.image || c.imageUrl)}
                      alt={c.title}
                      onError={(e) => {
                        e.currentTarget.src = "/no-image.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor} shadow-lg`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    {/* Category & Zakat */}
                    <div className="flex items-center gap-2 mb-3">
                      {c.category && (
                        <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-full">
                          {c.category}
                        </span>
                      )}
                      {c.zakatEligible && (
                        <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                          ✓ Zakat
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 min-h-[3rem]">
                      {c.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                      {c.shortDescription || "No description provided."}
                    </p>

                    {/* Admin Request Alert */}
                    {pendingRequest && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-[#8B5E00]">Verification needed</p>
                          {requestMeta && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${requestMeta.badge}`}
                            >
                              {requestMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-1">{pendingRequest.message}</p>
                        <button
                          onClick={() => openRespondModal(c, pendingRequest)}
                          className="mt-2 text-xs font-semibold text-[#00B5B8] hover:underline"
                        >
                          Upload documents →
                        </button>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                        <div
                          className="h-2 rounded-full transition-all bg-[#00B5B8]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-[#003d3b]">
                        <span>{formatCurrency(raised)}</span>
                        <span>of {formatCurrency(goal)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {percentage}% funded
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-[#E0F2F2]">
                      <span>Created {formatRequestTime(c.createdAt)}</span>
                      {c.updatedAt && c.updatedAt !== c.createdAt && (
                        <span>Updated {formatRequestTime(c.updatedAt)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/campaign/${c._id}`}
                        className="flex-1 bg-[#00B5B8] hover:bg-[#009EA1] text-white font-semibold py-2.5 px-4 rounded-xl text-center transition text-sm"
                      >
                        View Details
                      </Link>
                      {c.status !== "approved" && (
                        <Link
                          to={`/edit-campaign/${c._id}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-center transition text-sm"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Feed */}
        {activityFeed.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <h2 className="text-xl font-bold text-[#003d3b] mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activityFeed.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#E0F2F2] hover:bg-[#F1FAFA] transition"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      event.tone === "success"
                        ? "bg-green-500"
                        : event.tone === "danger"
                        ? "bg-red-500"
                        : event.tone === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#003d3b]">{event.label}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{event.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRequestTime(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {hasCampaigns && (
          <div className="text-center">
            <Link
              to="/create-campaign"
              className="inline-flex items-center gap-2 bg-[#00B5B8] hover:bg-[#009EA1] text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Campaign
            </Link>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00B5B8]">
                  Respond to admin
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#003d3b]">
                  Send supporting documents
                </h2>
                <p className="text-sm text-gray-500 mt-1">{responseModal.campaign?.title}</p>
              </div>
              <button
                onClick={closeRespondModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Admin message</p>
                <p>{responseModal.request?.message}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Requested {formatFullDate(responseModal.request?.createdAt)}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#003d3b]">Add a note (optional)</label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white/70 p-3 text-sm text-gray-700 focus:border-[#00B5B8] focus:outline-none focus:ring-2 focus:ring-[#00B5B8]/20"
                  placeholder="Explain what documents you're attaching..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#003d3b]">
                  Upload documents (JPG, PNG, PDF)
                </label>
                <div className="mt-2 rounded-2xl border-2 border-dashed border-[#CFE7E7] p-6 text-center text-sm text-gray-500">
                  <input
                    type="file"
                    id="verification-documents"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label
                    htmlFor="verification-documents"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#00B5B8]/10 px-4 py-2 text-[#00B5B8] font-semibold hover:bg-[#00B5B8]/20"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    Select files
                  </label>
                  <p className="mt-2 text-xs text-gray-400">Maximum 10 files, 10MB each</p>
                </div>

                {responseFiles.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm">
                    {responseFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-3 py-2 text-gray-700"
                      >
                        <span className="truncate pr-3">{file.name}</span>
                        <button
                          onClick={() => removeResponseFile(idx)}
                          className="text-xs font-semibold text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {responseError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {responseError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <button
                  onClick={closeRespondModal}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponseSubmit}
                  disabled={submittingResponse}
                  className="rounded-xl bg-[#00B5B8] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#009ea1] disabled:opacity-50"
                >
                  {submittingResponse ? "Uploading..." : "Send to admin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Popup */}
      {showRequestPopup && activeRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00B5B8]">
              Admin request
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#003d3b]">
              Please upload the required documents.
            </h2>
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Campaign</p>
              <p className="font-semibold text-[#003d3b]">{activeRequest.campaignTitle}</p>
              <p className="mt-3">{activeRequest.message}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRequestPopup(false)}
                className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Remind me later
              </button>
              <button
                onClick={() => {
                  setShowRequestPopup(false);
                  const campaign = myCampaigns.find((c) => c._id === activeRequest.campaignId);
                  if (campaign && activeRequest._id) {
                    const request = campaign.infoRequests?.find((r) => r._id === activeRequest._id);
                    if (request) {
                      openRespondModal(campaign, request);
                    }
                  }
                }}
                className="rounded-xl bg-[#00B5B8] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#009EA1]"
              >
                Upload Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
