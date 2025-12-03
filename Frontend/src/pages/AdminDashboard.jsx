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
  
  // New states for enhanced features
  const [campaignsWithResponses, setCampaignsWithResponses] = useState([]);
  const [selectedCampaignForResponse, setSelectedCampaignForResponse] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactReplyMessage, setContactReplyMessage] = useState("");
  const [activityLog, setActivityLog] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPagination, setActivityPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [pendingResponsesCount, setPendingResponsesCount] = useState(0);
  
  // Donations Management states
  const [donations, setDonations] = useState([]);
  const [donationPage, setDonationPage] = useState(1);
  const [donationSearch, setDonationSearch] = useState("");
  const [donationStatus, setDonationStatus] = useState("all");
  const [donationPaymentMethod, setDonationPaymentMethod] = useState("all");
  const [donationRiskLevel, setDonationRiskLevel] = useState("all");
  const [donationIsSuspicious, setDonationIsSuspicious] = useState("");
  const [donationDateFrom, setDonationDateFrom] = useState("");
  const [donationDateTo, setDonationDateTo] = useState("");
  const [donationMinAmount, setDonationMinAmount] = useState("");
  const [donationMaxAmount, setDonationMaxAmount] = useState("");
  const [donationPagination, setDonationPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [donationStats, setDonationStats] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationActionLoading, setDonationActionLoading] = useState(null);
  
  // Separate states for commit and immediate donations
  const [commitDonations, setCommitDonations] = useState([]);
  const [immediateDonations, setImmediateDonations] = useState([]);
  const [commitDonationPage, setCommitDonationPage] = useState(1);
  const [immediateDonationPage, setImmediateDonationPage] = useState(1);
  const [commitDonationPagination, setCommitDonationPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [immediateDonationPagination, setImmediateDonationPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const token = localStorage.getItem("adminToken");

  const authHeaders = (json = true) => {
    const h = { Authorization: `Bearer ${token}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  };

  const isValidDocument = (doc) => {
    if (!doc) return false;
    if (typeof doc !== "string") return false;
    const normalized = doc.trim().toLowerCase();
    return normalized !== "" && 
           normalized !== "undefined" && 
           normalized !== "null" &&
           !normalized.includes("undefined") &&
           !normalized.includes("null");
  };

  const resolveImg = (img) => {
    const FALLBACK = "https://via.placeholder.com/400x240?text=No+Image";
    
    // Validate document first
    if (!isValidDocument(img)) {
      return FALLBACK;
    }
    
    // If it's already a full URL, return as is
    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    
    // Clean the path and construct URL
    const cleanedPath = img.replace(/^\/+/, "").trim();
    
    // Double-check after cleaning
    if (!cleanedPath || cleanedPath === "undefined" || cleanedPath === "null" || cleanedPath.includes("undefined")) {
      return FALLBACK;
    }
    
    // Ensure API_URL doesn't have trailing slash and path doesn't start with slash
    const baseUrl = API_URL?.replace(/\/+$/, "") || "";
    if (!baseUrl) {
      console.error("API_URL is not defined");
      return FALLBACK;
    }
    
    return `${baseUrl}/${cleanedPath}`;
  };

  const resolveDocumentUrl = (doc) => {
    if (!isValidDocument(doc)) {
      return null; // Return null for invalid documents to prevent links
    }
    return resolveImg(doc);
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

  // Load commit donations (paymentMethod: "commitment")
  const loadCommitDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_URL}/api/donations/admin/all`);
      url.searchParams.set("page", commitDonationPage);
      url.searchParams.set("limit", "20");
      url.searchParams.set("paymentMethod", "commitment");
      if (donationSearch) url.searchParams.set("search", donationSearch);
      if (donationStatus !== "all") url.searchParams.set("status", donationStatus);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load commit donations");

      const data = await res.json();
      if (data.success) {
        setCommitDonations(data.donations || []);
        if (data.pagination) {
          setCommitDonationPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Error loading commit donations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load immediate donations (paymentMethod != "commitment")
  const loadImmediateDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_URL}/api/donations/admin/all`);
      url.searchParams.set("page", immediateDonationPage);
      url.searchParams.set("limit", "20");
      // Exclude commitment payments
      if (donationSearch) url.searchParams.set("search", donationSearch);
      if (donationStatus !== "all") url.searchParams.set("status", donationStatus);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load immediate donations");

      const data = await res.json();
      if (data.success) {
        // Filter out commitment payments
        const immediate = (data.donations || []).filter(d => d.paymentMethod !== "commitment");
        setImmediateDonations(immediate);
        if (data.pagination) {
          setImmediateDonationPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Error loading immediate donations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load all donations with filters (legacy - keeping for compatibility)
  const loadDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API_URL}/api/donations/admin/all`);
      url.searchParams.set("page", donationPage);
      url.searchParams.set("limit", "20");
      if (donationSearch) url.searchParams.set("search", donationSearch);
      if (donationStatus !== "all") url.searchParams.set("status", donationStatus);
      if (donationPaymentMethod !== "all") url.searchParams.set("paymentMethod", donationPaymentMethod);
      if (donationRiskLevel !== "all") url.searchParams.set("riskLevel", donationRiskLevel);
      if (donationIsSuspicious !== "") url.searchParams.set("isSuspicious", donationIsSuspicious);
      if (donationDateFrom) url.searchParams.set("dateFrom", donationDateFrom);
      if (donationDateTo) url.searchParams.set("dateTo", donationDateTo);
      if (donationMinAmount) url.searchParams.set("minAmount", donationMinAmount);
      if (donationMaxAmount) url.searchParams.set("maxAmount", donationMaxAmount);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });

      if (res.status === 401) {
        setError("Unauthorized — login again.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load donations");

      const data = await res.json();
      if (data.success) {
        setDonations(data.donations || []);
        if (data.pagination) {
          setDonationPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Error loading donations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load donation statistics
  const loadDonationStats = async () => {
    try {
      const url = new URL(`${API_URL}/api/donations/admin/stats`);
      if (donationDateFrom) url.searchParams.set("dateFrom", donationDateFrom);
      if (donationDateTo) url.searchParams.set("dateTo", donationDateTo);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });
      if (!res.ok) throw new Error("Failed to load donation stats");

      const data = await res.json();
      if (data.success) {
        setDonationStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading donation stats:", err);
    }
  };

  // Load single donation details
  const loadDonationDetails = async (donationId) => {
    try {
      const res = await fetch(`${API_URL}/api/donations/admin/${donationId}`, {
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load donation details");

      const data = await res.json();
      if (data.success) {
        setSelectedDonation(data.donation);
        setDonationModalOpen(true);
      }
    } catch (err) {
      console.error("Error loading donation details:", err);
      setError(err.message);
    }
  };

  // Update donation status
  const updateDonation = async (donationId, updates) => {
    setDonationActionLoading(donationId);
    try {
      const res = await fetch(`${API_URL}/api/donations/admin/${donationId}/status`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update donation");

      const data = await res.json();
      if (data.success) {
        // Reload appropriate section based on payment method
        const donation = data.donation;
        if (donation.paymentMethod === "commitment") {
          await loadCommitDonations();
        } else {
          await loadImmediateDonations();
        }
        await loadDonationStats();
        if (selectedDonation?._id === donationId) {
          setSelectedDonation(data.donation);
        }
        setError("");
      }
    } catch (err) {
      console.error("Error updating donation:", err);
      setError(err.message);
    } finally {
      setDonationActionLoading(null);
    }
  };

  // Flag donation as suspicious
  const flagDonation = async (donationId, reason) => {
    setDonationActionLoading(donationId);
    try {
      const res = await fetch(`${API_URL}/api/donations/admin/${donationId}/flag`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) throw new Error("Failed to flag donation");

      const data = await res.json();
      if (data.success) {
        await loadDonations();
        if (selectedDonation?._id === donationId) {
          setSelectedDonation(data.donation);
        }
        setError("");
      }
    } catch (err) {
      console.error("Error flagging donation:", err);
      setError(err.message);
    } finally {
      setDonationActionLoading(null);
    }
  };

  // Export donations to CSV
  const exportDonations = async () => {
    try {
      const url = new URL(`${API_URL}/api/donations/admin/all`);
      url.searchParams.set("limit", "10000"); // Get all
      if (donationSearch) url.searchParams.set("search", donationSearch);
      if (donationStatus !== "all") url.searchParams.set("status", donationStatus);
      if (donationPaymentMethod !== "all") url.searchParams.set("paymentMethod", donationPaymentMethod);
      if (donationDateFrom) url.searchParams.set("dateFrom", donationDateFrom);
      if (donationDateTo) url.searchParams.set("dateTo", donationDateTo);

      const res = await fetch(url.toString(), { headers: authHeaders(false) });
      if (!res.ok) throw new Error("Failed to export donations");

      const data = await res.json();
      if (data.success && data.donations) {
        // Convert to CSV
        const headers = [
          "Receipt #",
          "Date",
          "Donor Name",
          "Email",
          "Campaign",
          "Amount",
          "Status",
          "Payment Method",
          "Message",
          "Risk Level",
          "Suspicious",
        ];
        const rows = data.donations.map((d) => [
          d.receiptNumber || "N/A",
          new Date(d.createdAt).toLocaleString(),
          d.isAnonymous ? "Anonymous" : (d.donorName || "N/A"),
          d.donorEmail || "N/A",
          d.campaignId?.title || "N/A",
          d.amount,
          d.paymentStatus,
          d.paymentMethod,
          d.message || "",
          d.riskLevel || "low",
          d.isSuspicious ? "Yes" : "No",
        ]);

        const csv = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `donations_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
      }
    } catch (err) {
      console.error("Error exporting donations:", err);
      setError("Failed to export donations");
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

  // Load campaigns with pending user responses
  const loadCampaignsWithResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/campaigns-with-pending-responses`, {
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load campaigns with responses");
      const data = await res.json();
      setCampaignsWithResponses(data.campaigns || []);
      setPendingResponsesCount(data.campaigns?.length || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load activity log
  const loadActivityLog = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/admin/activity-log`);
      url.searchParams.set("page", activityPage);
      url.searchParams.set("limit", "50");

      const res = await fetch(url, { headers: authHeaders(false) });
      if (!res.ok) throw new Error("Failed to load activity log");
      const data = await res.json();
      setActivityLog(data.activities || []);
      setActivityPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get full campaign details with responses
  const loadCampaignDetails = async (campaignId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/campaigns/${campaignId}/responses`, {
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load campaign details");
      const data = await res.json();
      setSelectedCampaignForResponse(data.campaign);
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin respond to user's response
  const respondToUserResponse = async (campaignId, requestId, responseId, message, action) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/campaigns/${campaignId}/info-requests/${requestId}/responses/${responseId}/respond`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({ message, action }),
        }
      );
      if (!res.ok) throw new Error("Failed to respond");
      await loadCampaignDetails(campaignId);
      await loadCampaignsWithResponses();
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Add admin reply to contact query
  const addContactReply = async (contactId) => {
    if (!contactReplyMessage.trim()) {
      setError("Please enter a message");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/contact/${contactId}/reply`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ message: contactReplyMessage }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      setContactReplyMessage("");
      await loadContactQueries();
      if (selectedContact?._id === contactId) {
        const updatedRes = await fetch(`${API_URL}/api/contact/${contactId}`, {
          headers: authHeaders(false),
        });
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setSelectedContact(data.contact);
        }
      }
      setError("");
    } catch (err) {
      setError(err.message);
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
      } else if (activeTab === "user-responses") {
        loadCampaignsWithResponses();
      } else if (activeTab === "activity") {
        loadActivityLog();
      } else if (activeTab === "commit-donations") {
        loadCommitDonations();
        loadDonationStats();
      } else if (activeTab === "immediate-donations") {
        loadImmediateDonations();
        loadDonationStats();
      } else if (activeTab === "donations") {
        loadDonations();
        loadDonationStats();
      } else {
        load(activeTab);
      }
    }, campaignSearch || contactSearch ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => clearTimeout(timer);
  }, [activeTab, userPage, userSearch, campaignPage, campaignSearch, contactPage, contactSearch, donationPage, donationSearch, donationStatus, donationPaymentMethod, donationRiskLevel, donationIsSuspicious, donationDateFrom, donationDateTo, donationMinAmount, donationMaxAmount]);

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
                                    {resp.documents
                                      .filter(isValidDocument)
                                      .map((doc, docIdx) => {
                                        const docUrl = resolveDocumentUrl(doc);
                                        if (!docUrl) return null;
                                        return (
                                          <a
                                            key={`${req._id || idx}-resp-${respIdx}-doc-${docIdx}`}
                                            href={docUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-semibold text-sky-700 hover:border-sky-400"
                                            onClick={(e) => {
                                              if (!docUrl || docUrl.includes("undefined")) {
                                                e.preventDefault();
                                                alert("Document path is invalid");
                                              }
                                            }}
                                          >
                                            View file {docIdx + 1}
                                          </a>
                                        );
                                      })}
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
                  {(c.documents?.length ? c.documents : c.medicalDocuments || [])
                    .filter(isValidDocument)
                    .map((doc, idx) => {
                      const docUrl = resolveDocumentUrl(doc);
                      if (!docUrl) return null;
                      return (
                        <img
                          key={`${c._id}-doc-${idx}`}
                          src={docUrl}
                          alt="Document"
                          className="h-16 w-16 object-cover rounded border"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64x64?text=No+Image";
                          }}
                        />
                      );
                    })}
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
        { key: "user-responses", label: "User Responses", icon: "💬", badge: true },
        { key: "approved", label: "Approved", icon: "✅" },
        { key: "rejected", label: "Rejected", icon: "❌" },
        { key: "users", label: "Users", icon: "👥" },
        { key: "contacts", label: "Contact Queries", icon: "📧" },
        { key: "commit-donations", label: "Commit Donations", icon: "💳" },
        { key: "immediate-donations", label: "Immediate Donations", icon: "💰" },
        { key: "activity", label: "Activity Log", icon: "📋" },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => {
            setActiveTab(t.key);
            setCampaignPage(1);
            setCampaignSearch("");
            setContactPage(1);
            setContactSearch("");
            setDonationPage(1);
            setDonationSearch("");
            setDonationStatus("all");
            setDonationPaymentMethod("all");
            setDonationRiskLevel("all");
            setDonationIsSuspicious("");
            setDonationDateFrom("");
            setDonationDateTo("");
            setDonationMinAmount("");
            setDonationMaxAmount("");
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
          } else if (activeTab === "commit-donations") {
            loadCommitDonations();
            loadDonationStats();
          } else if (activeTab === "immediate-donations") {
            loadImmediateDonations();
            loadDonationStats();
          } else if (activeTab === "donations") {
            loadDonations();
            loadDonationStats();
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
        {activeTab === "user-responses" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-4 flex items-center gap-2">
                💬 User Responses to Info Requests
                {pendingResponsesCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                    {pendingResponsesCount} New
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mb-4">
                View and respond to user responses to your information requests
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user responses...</p>
              </div>
            ) : campaignsWithResponses.length > 0 ? (
              <div className="space-y-4">
                {campaignsWithResponses.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2] hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#003d3b] mb-2">{campaign.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Beneficiary: {campaign.beneficiaryName} • {campaign.city}
                        </p>
                        <p className="text-xs text-gray-500">
                          Owner: {campaign.owner?.name || "Unknown"} ({campaign.owner?.email || "N/A"})
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCampaignForResponse(campaign);
                          loadCampaignDetails(campaign._id);
                        }}
                        className="px-4 py-2 bg-[#00B5B8] text-white font-semibold rounded-lg hover:bg-[#009EA1] transition"
                      >
                        View Details
                      </button>
                    </div>

                    {campaign.pendingRequests?.map((req, idx) => (
                      <div key={idx} className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-amber-700">
                            Info Request #{idx + 1}
                          </span>
                          <span className="text-xs text-amber-600">
                            {formatDate(req.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{req.message}</p>
                        {req.unviewedResponses?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-red-600">
                              {req.unviewedResponses.length} Unviewed Response(s):
                            </p>
                            {req.unviewedResponses.map((resp, respIdx) => (
                              <div key={respIdx} className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-700 mb-2">{resp.note || "No note provided"}</p>
                                {resp.documents?.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {resp.documents
                                      .filter(isValidDocument)
                                      .map((doc, docIdx) => {
                                        const docUrl = resolveDocumentUrl(doc);
                                        if (!docUrl) return null;
                                        return (
                                          <a
                                            key={docIdx}
                                            href={docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#00B5B8] hover:underline"
                                            onClick={(e) => {
                                              if (!docUrl || docUrl.includes("undefined")) {
                                                e.preventDefault();
                                                return false;
                                              }
                                            }}
                                          >
                                            📄 Document {docIdx + 1}
                                          </a>
                                        );
                                      })}
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Uploaded: {formatDate(resp.uploadedAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No pending user responses</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "donations" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#003d3b] mb-2">💰 Donations Management</h2>
                  <p className="text-gray-600">Comprehensive view of all donations with detailed information and management tools</p>
                </div>
                <button
                  onClick={exportDonations}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            {donationStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E0F2F2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                      <p className="text-2xl font-bold text-[#003d3b]">{donationStats.totalDonations}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E0F2F2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-[#00B5B8]">{formatCurrency(donationStats.totalAmount)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E0F2F2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{donationStats.pendingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⏳</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-[#E0F2F2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Suspicious</p>
                      <p className="text-2xl font-bold text-red-600">{donationStats.suspiciousCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <h3 className="text-lg font-bold text-[#003d3b] mb-4">Filters & Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by name, email, receipt #..."
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && loadDonations()}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <select
                  value={donationStatus}
                  onChange={(e) => setDonationStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={donationPaymentMethod}
                  onChange={(e) => setDonationPaymentMethod(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="all">All Methods</option>
                  <option value="commitment">Commitment</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                </select>
                <select
                  value={donationRiskLevel}
                  onChange={(e) => setDonationRiskLevel(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <select
                  value={donationIsSuspicious}
                  onChange={(e) => setDonationIsSuspicious(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="">All</option>
                  <option value="true">Suspicious Only</option>
                  <option value="false">Not Suspicious</option>
                </select>
                <input
                  type="date"
                  placeholder="From Date"
                  value={donationDateFrom}
                  onChange={(e) => setDonationDateFrom(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <input
                  type="date"
                  placeholder="To Date"
                  value={donationDateTo}
                  onChange={(e) => setDonationDateTo(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={donationMinAmount}
                  onChange={(e) => setDonationMinAmount(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={donationMaxAmount}
                  onChange={(e) => setDonationMaxAmount(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadDonations}
                  className="px-6 py-3 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setDonationSearch("");
                    setDonationStatus("all");
                    setDonationPaymentMethod("all");
                    setDonationRiskLevel("all");
                    setDonationIsSuspicious("");
                    setDonationDateFrom("");
                    setDonationDateTo("");
                    setDonationMinAmount("");
                    setDonationMaxAmount("");
                    setDonationPage(1);
                    loadDonations();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Donations Table */}
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading donations...</p>
              </div>
            ) : donations.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E0F2F2] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#00B5B8] text-white">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Receipt #</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Donor</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Campaign</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Amount</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Status</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Method</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Risk</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Date</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {donations.map((donation) => (
                        <tr key={donation._id} className={`hover:bg-[#E6F7F7] transition ${donation.isSuspicious ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-gray-600">
                              {donation.receiptNumber || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <span className="font-semibold text-[#003d3b] text-sm block">
                                {donation.isAnonymous ? "Anonymous" : (donation.donorName || donation.donorId?.name || "N/A")}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {donation.donorEmail || donation.donorId?.email || "N/A"}
                              </span>
                              {donation.accountHolder && (
                                <div className="mt-1 pt-1 border-t border-gray-200">
                                  <span className="text-xs text-blue-600 font-semibold">Account Holder:</span>
                                  <span className="text-xs text-blue-700 block">{donation.accountHolder.name}</span>
                                  <span className="text-xs text-blue-600">{donation.accountHolder.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-700 text-sm max-w-xs truncate block" title={donation.campaignId?.title || ""}>
                              {donation.campaignId?.title || "Campaign Deleted"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#00B5B8]">
                              {formatCurrency(donation.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              donation.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : donation.paymentStatus === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : donation.paymentStatus === "success"
                                ? "bg-green-100 text-green-800"
                                : donation.paymentStatus === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {donation.paymentStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 text-xs capitalize">
                              {donation.paymentMethod || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                donation.riskLevel === "critical"
                                  ? "bg-red-100 text-red-800"
                                  : donation.riskLevel === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : donation.riskLevel === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {donation.riskLevel || "low"}
                              </span>
                              {donation.isSuspicious && (
                                <span className="text-red-500" title="Flagged as suspicious">⚠️</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 text-xs">
                              {formatDate(donation.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => loadDonationDetails(donation._id)}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                title="View Details"
                              >
                                👁️
                              </button>
                              {donation.paymentStatus === "pending" && (
                                <button
                                  onClick={() => updateDonation(donation._id, { paymentStatus: "success", paymentReceived: true })}
                                  disabled={donationActionLoading === donation._id}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition disabled:opacity-50"
                                  title="Mark as Paid"
                                >
                                  ✓
                                </button>
                              )}
                              {!donation.isSuspicious && (
                                <button
                                  onClick={() => flagDonation(donation._id, "Flagged by admin")}
                                  disabled={donationActionLoading === donation._id}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition disabled:opacity-50"
                                  title="Flag as Suspicious"
                                >
                                  ⚠️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {donationPagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {donationPagination.page} of {donationPagination.pages} ({donationPagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDonationPage(Math.max(1, donationPage - 1));
                        }}
                        disabled={donationPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setDonationPage(Math.min(donationPagination.pages, donationPage + 1));
                        }}
                        disabled={donationPage === donationPagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No donations found</p>
              </div>
            )}

            {/* Donation Details Modal */}
            {donationModalOpen && selectedDonation && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-[#003d3b]">Donation Details</h3>
                    <button
                      onClick={() => {
                        setDonationModalOpen(false);
                        setSelectedDonation(null);
                      }}
                      className="text-gray-400 hover:text-[#00B5B8] text-2xl font-light transition"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-[#003d3b] mb-2">Donor Information</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Name:</strong> {selectedDonation.isAnonymous ? "Anonymous" : (selectedDonation.donorName || selectedDonation.donorId?.name || "N/A")}</p>
                        <p><strong>Email:</strong> {selectedDonation.donorEmail || selectedDonation.donorId?.email || "N/A"}</p>
                        <p><strong>Phone:</strong> {selectedDonation.donorPhone || selectedDonation.donorId?.phone || "N/A"}</p>
                        <p><strong>Anonymous:</strong> {selectedDonation.isAnonymous ? "Yes" : "No"}</p>
                        {selectedDonation.accountHolder && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold text-blue-700 mb-2">Account Holder Information:</p>
                            <p><strong>Account Name:</strong> {selectedDonation.accountHolder.name}</p>
                            <p><strong>Account Email:</strong> {selectedDonation.accountHolder.email}</p>
                            <p><strong>Provider:</strong> {selectedDonation.accountHolder.provider || "N/A"}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#003d3b] mb-2">Campaign Information</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Title:</strong> {selectedDonation.campaignId?.title || "N/A"}</p>
                        <p><strong>Beneficiary:</strong> {selectedDonation.campaignId?.beneficiaryName || "N/A"}</p>
                        <p><strong>Category:</strong> {selectedDonation.campaignId?.category || "N/A"}</p>
                        <p><strong>Goal:</strong> {formatCurrency(selectedDonation.campaignId?.goalAmount || 0)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#003d3b] mb-2">Payment Details</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Amount:</strong> {formatCurrency(selectedDonation.amount)}</p>
                        <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${selectedDonation.paymentStatus === "success" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{selectedDonation.paymentStatus}</span></p>
                        <p><strong>Method:</strong> {selectedDonation.paymentMethod || "N/A"}</p>
                        <p><strong>Receipt #:</strong> {selectedDonation.receiptNumber || "N/A"}</p>
                        <p><strong>Payment Received:</strong> {selectedDonation.paymentReceived ? "Yes" : "No"}</p>
                        {selectedDonation.paymentReceivedAt && (
                          <p><strong>Received At:</strong> {formatDate(selectedDonation.paymentReceivedAt)}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#003d3b] mb-2">Security & Risk</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Risk Level:</strong> <span className={`px-2 py-1 rounded text-xs ${selectedDonation.riskLevel === "critical" ? "bg-red-100 text-red-800" : selectedDonation.riskLevel === "high" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>{selectedDonation.riskLevel || "low"}</span></p>
                        <p><strong>Fraud Score:</strong> {selectedDonation.fraudScore || 0}/100</p>
                        <p><strong>Suspicious:</strong> {selectedDonation.isSuspicious ? "Yes ⚠️" : "No"}</p>
                        {selectedDonation.suspiciousReason && (
                          <p><strong>Reason:</strong> {selectedDonation.suspiciousReason}</p>
                        )}
                        <p><strong>IP Address:</strong> {selectedDonation.ipAddress || "N/A"}</p>
                        <p><strong>Donations from IP (24h):</strong> {selectedDonation.donationCountFromIP || 1}</p>
                      </div>
                    </div>

                    {selectedDonation.message && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-[#003d3b] mb-2">Message</h4>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm">
                          {selectedDonation.message}
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-[#003d3b] mb-2">Timestamps</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Created:</strong> {new Date(selectedDonation.createdAt).toLocaleString()}</p>
                        {selectedDonation.updatedAt && (
                          <p><strong>Updated:</strong> {new Date(selectedDonation.updatedAt).toLocaleString()}</p>
                        )}
                        {selectedDonation.flaggedAt && (
                          <p><strong>Flagged At:</strong> {new Date(selectedDonation.flaggedAt).toLocaleString()}</p>
                        )}
                        {selectedDonation.reviewedAt && (
                          <p><strong>Reviewed At:</strong> {new Date(selectedDonation.reviewedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2 flex-wrap">
                    {selectedDonation.paymentStatus === "pending" && (
                      <button
                        onClick={() => updateDonation(selectedDonation._id, { paymentStatus: "success", paymentReceived: true })}
                        disabled={donationActionLoading === selectedDonation._id}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {!selectedDonation.isSuspicious && (
                      <button
                        onClick={() => flagDonation(selectedDonation._id, "Flagged by admin")}
                        disabled={donationActionLoading === selectedDonation._id}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Flag as Suspicious
                      </button>
                    )}
                    {selectedDonation.donorEmail && (
                      <a
                        href={`mailto:${selectedDonation.donorEmail}`}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                      >
                        Contact Donor
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commit Donations Section */}
        {activeTab === "commit-donations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-2">💳 Commit Donations</h2>
              <p className="text-gray-600">View and manage payment commitments. Users commit to pay later, then pay personally to admin.</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by name, email, receipt #..."
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && loadCommitDonations()}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <select
                  value={donationStatus}
                  onChange={(e) => setDonationStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={loadCommitDonations}
                  className="px-6 py-3 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
                >
                  Search
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading commit donations...</p>
              </div>
            ) : commitDonations.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E0F2F2] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#00B5B8] text-white">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Receipt #</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Donor</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Campaign</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Amount</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Status</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Date</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {commitDonations.map((donation) => (
                        <tr key={donation._id} className="hover:bg-[#E6F7F7] transition">
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-gray-600">
                              {donation.receiptNumber || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <span className="font-semibold text-[#003d3b] text-sm block">
                                {donation.isAnonymous ? "Anonymous" : (donation.donorName || "N/A")}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {donation.donorEmail || "N/A"}
                              </span>
                              {donation.accountHolder && (
                                <div className="mt-1 pt-1 border-t border-gray-200">
                                  <span className="text-xs text-blue-600 font-semibold">Account Holder:</span>
                                  <span className="text-xs text-blue-700 block">{donation.accountHolder.name}</span>
                                  <span className="text-xs text-blue-600">{donation.accountHolder.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-700 text-sm max-w-xs truncate block" title={donation.campaignId?.title || ""}>
                              {donation.campaignId?.title || "Campaign Deleted"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#00B5B8]">
                              {formatCurrency(donation.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              donation.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : donation.paymentStatus === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {donation.paymentStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 text-xs">
                              {formatDate(donation.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => loadDonationDetails(donation._id)}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                title="View Details"
                              >
                                👁️
                              </button>
                              {donation.paymentStatus === "pending" && (
                                <button
                                  onClick={() => updateDonation(donation._id, { paymentStatus: "success", paymentReceived: true })}
                                  disabled={donationActionLoading === donation._id}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition disabled:opacity-50"
                                  title="Approve Payment"
                                >
                                  ✓
                                </button>
                              )}
                              {donation.paymentStatus === "pending" && (
                                <button
                                  onClick={() => updateDonation(donation._id, { paymentStatus: "failed", adminRejected: true, rejectionReason: "Payment not received" })}
                                  disabled={donationActionLoading === donation._id}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition disabled:opacity-50"
                                  title="Reject"
                                >
                                  ✗
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {commitDonationPagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {commitDonationPagination.page} of {commitDonationPagination.pages} ({commitDonationPagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCommitDonationPage(Math.max(1, commitDonationPage - 1))}
                        disabled={commitDonationPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCommitDonationPage(Math.min(commitDonationPagination.pages, commitDonationPage + 1))}
                        disabled={commitDonationPage === commitDonationPagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No commit donations found</p>
              </div>
            )}
          </div>
        )}

        {/* Immediate Donations Section */}
        {activeTab === "immediate-donations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-2">💰 Immediate Donations</h2>
              <p className="text-gray-600">View and manage immediate payment transactions (Razorpay, UPI, Card, etc.)</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by name, email, receipt #..."
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && loadImmediateDonations()}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                />
                <select
                  value={donationStatus}
                  onChange={(e) => setDonationStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={loadImmediateDonations}
                  className="px-6 py-3 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
                >
                  Search
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading immediate donations...</p>
              </div>
            ) : immediateDonations.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-[#E0F2F2] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#00B5B8] text-white">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Receipt #</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Donor</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Campaign</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Amount</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Method</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Status</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Date</th>
                        <th className="px-4 py-4 text-left font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {immediateDonations.map((donation) => (
                        <tr key={donation._id} className="hover:bg-[#E6F7F7] transition">
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-gray-600">
                              {donation.receiptNumber || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <span className="font-semibold text-[#003d3b] text-sm block">
                                {donation.isAnonymous ? "Anonymous" : (donation.donorName || "N/A")}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {donation.donorEmail || "N/A"}
                              </span>
                              {donation.accountHolder && (
                                <div className="mt-1 pt-1 border-t border-gray-200">
                                  <span className="text-xs text-blue-600 font-semibold">Account Holder:</span>
                                  <span className="text-xs text-blue-700 block">{donation.accountHolder.name}</span>
                                  <span className="text-xs text-blue-600">{donation.accountHolder.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-700 text-sm max-w-xs truncate block" title={donation.campaignId?.title || ""}>
                              {donation.campaignId?.title || "Campaign Deleted"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#00B5B8]">
                              {formatCurrency(donation.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 text-xs capitalize">
                              {donation.paymentMethod || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              donation.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : donation.paymentStatus === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {donation.paymentStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 text-xs">
                              {formatDate(donation.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => loadDonationDetails(donation._id)}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                              title="View Details"
                            >
                              👁️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {immediateDonationPagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {immediateDonationPagination.page} of {immediateDonationPagination.pages} ({immediateDonationPagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImmediateDonationPage(Math.max(1, immediateDonationPage - 1))}
                        disabled={immediateDonationPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setImmediateDonationPage(Math.min(immediateDonationPagination.pages, immediateDonationPage + 1))}
                        disabled={immediateDonationPage === immediateDonationPagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No immediate donations found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
              <h2 className="text-2xl font-bold text-[#003d3b] mb-4">📋 Activity Log</h2>
              <p className="text-gray-600">Comprehensive log of all platform activities</p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity log...</p>
              </div>
            ) : activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.map((activity, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow p-4 border border-[#E0F2F2] hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#00B5B8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00B5B8] text-lg">
                          {activity.type === "campaign_created" ? "📝" :
                           activity.type === "campaign_approved" ? "✅" :
                           activity.type === "campaign_rejected" ? "❌" :
                           activity.type === "user_response" ? "💬" :
                           activity.type === "donation_made" ? "💰" :
                           activity.type === "user_registered" ? "👤" : "📋"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#003d3b]">{activity.details}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-gray-600 mt-1">
                            User: {activity.user.name || activity.user.email || "Unknown"}
                          </p>
                        )}
                        {activity.campaign && (
                          <p className="text-xs text-gray-600 mt-1">
                            Campaign: {activity.campaign.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
                <p className="text-gray-500 text-lg">No activity found</p>
              </div>
            )}
          </div>
        )}
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
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_URL}/api/contact/${query._id}`, {
                              headers: authHeaders(false),
                            });
                            if (!res.ok) throw new Error("Failed to load contact details");
                            const data = await res.json();
                            setSelectedContact(data.contact);
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                        className="px-4 py-2 bg-[#00B5B8] text-white font-semibold rounded-lg hover:bg-[#009EA1] transition text-sm"
                      >
                        View Conversation
                      </button>
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

        {/* Modal: Campaign Details with User Responses */}
        {selectedCampaignForResponse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E0F2F2] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#003d3b]">
                  {selectedCampaignForResponse.title}
                </h2>
                <button
                  onClick={() => setSelectedCampaignForResponse(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedCampaignForResponse.infoRequests?.map((req, reqIdx) => (
                  <div key={reqIdx} className="border border-[#E0F2F2] rounded-xl p-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-amber-700">Admin Request #{reqIdx + 1}</span>
                        <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          req.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{req.message}</p>
                    </div>

                    {req.responses?.map((resp, respIdx) => (
                      <div key={respIdx} className="ml-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-700">User Response #{respIdx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{formatDate(resp.uploadedAt)}</span>
                            {!resp.adminViewed && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">New</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{resp.note || "No note provided"}</p>
                        {resp.documents?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Documents:</p>
                            <div className="flex flex-wrap gap-2">
                              {resp.documents
                                .filter(isValidDocument)
                                .map((doc, docIdx) => {
                                  const docUrl = resolveDocumentUrl(doc);
                                  if (!docUrl) return null;
                                  return (
                                    <a
                                      key={docIdx}
                                      href={docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#00B5B8] hover:underline bg-white px-2 py-1 rounded border"
                                      onClick={(e) => {
                                        if (!docUrl || docUrl.includes("undefined")) {
                                          e.preventDefault();
                                          return false;
                                        }
                                      }}
                                    >
                                      📄 Document {docIdx + 1}
                                    </a>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {!resp.adminViewed && (
                          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                            <textarea
                              placeholder="Add your response or follow-up message..."
                              className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                              rows="3"
                              id={`response-${reqIdx}-${respIdx}`}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  const message = document.getElementById(`response-${reqIdx}-${respIdx}`).value;
                                  await respondToUserResponse(
                                    selectedCampaignForResponse._id,
                                    req._id || reqIdx,
                                    resp._id || respIdx,
                                    message,
                                    "approve"
                                  );
                                }}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Approve Response
                              </button>
                              <button
                                onClick={async () => {
                                  const message = document.getElementById(`response-${reqIdx}-${respIdx}`).value;
                                  await respondToUserResponse(
                                    selectedCampaignForResponse._id,
                                    req._id || reqIdx,
                                    resp._id || respIdx,
                                    message,
                                    "request_more"
                                  );
                                }}
                                className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                              >
                                Request More Info
                              </button>
                            </div>
                          </div>
                        )}

                        {resp.adminFollowUp?.message && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-xs font-semibold text-green-700 mb-1">Admin Follow-up:</p>
                            <p className="text-sm text-green-900">{resp.adminFollowUp.message}</p>
                            <p className="text-xs text-green-600 mt-1">
                              {formatDate(resp.adminFollowUp.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Contact Conversation Thread */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E0F2F2] p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#003d3b]">{selectedContact.name}</h2>
                  <p className="text-sm text-gray-600">{selectedContact.email || "No email"}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setContactReplyMessage("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Original Query */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Original Query:</p>
                  <p className="text-sm text-gray-700">{selectedContact.query}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(selectedContact.createdAt)}</p>
                </div>

                {/* Conversation Thread */}
                {selectedContact.conversation?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.sender === "admin"
                        ? "bg-blue-50 border border-blue-200 ml-8"
                        : "bg-gray-50 border border-gray-200 mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">
                        {msg.sender === "admin" ? "Admin" : "User"}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, attIdx) => (
                          <a
                            key={attIdx}
                            href={`${API_URL}/${att}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#00B5B8] hover:underline"
                          >
                            📎 Attachment {attIdx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Reply Section */}
                <div className="border-t border-[#E0F2F2] pt-4">
                  <textarea
                    value={contactReplyMessage}
                    onChange={(e) => setContactReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-3 border border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] mb-3"
                    rows="4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addContactReply(selectedContact._id)}
                      className="px-6 py-2 bg-[#00B5B8] text-white font-semibold rounded-lg hover:bg-[#009EA1] transition"
                    >
                      Send Reply
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/api/contact/${selectedContact._id}`, {
                            method: "PUT",
                            headers: authHeaders(true),
                            body: JSON.stringify({ status: "resolved" }),
                          });
                          if (!res.ok) throw new Error("Failed to resolve");
                          await loadContactQueries();
                          setSelectedContact(null);
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
