import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Profile() {
  const token = localStorage.getItem("token");
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [responseModal, setResponseModal] = useState(null);
  const [responseFiles, setResponseFiles] = useState([]);
  const [responseNote, setResponseNote] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");
  const popupShownRef = useRef(false);

  // Fetch my campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/campaigns/my`, {
          headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

  // Use imageUrl from backend (virtual field) or fallback
  const getImageUrl = (campaign) => {
    return campaign?.imageUrl || campaign?.image || "";
  };

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;

    // If image is a relative path from server
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

    if (!token) {
      setResponseError("Please sign in again to upload documents.");
      return;
    }

    if (!responseFiles.length && !responseNote.trim()) {
      setResponseError("Upload at least one document or add a note for the admin.");
      return;
    }

    setSubmittingResponse(true);
    setResponseError("");

    try {
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
            Authorization: `Bearer ${token}`,
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
      setResponseError(err.response?.data?.message || "Failed to upload documents. Please try again.");
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
      <div className="min-h-screen bg-[#F9F5E7] pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-20 text-gray-600">Loading your fundraisers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5E7] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003d3b] mb-2">My Fundraisers</h1>
          <p className="text-gray-600">Manage and track all your fundraising campaigns</p>
        </div>

        {/* Admin notifications */}
        {adminRequests.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold">Action required</p>
                <p className="text-base font-semibold">
                  Admin needs more information for {adminRequests.length} campaign{adminRequests.length > 1 ? "s" : ""}.
                </p>
              </div>
              <button
                onClick={() => openRequestPopup(adminRequests[0])}
                className="self-start rounded-md bg-[#00B5B8] px-4 py-2 text-sm font-semibold text-white shadow"
              >
                View request
              </button>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              {adminRequests.map((req) => (
                <li key={`${req.campaignId}-${req._id}`} className="rounded-md border border-amber-100 bg-white/70 p-3 text-amber-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#8B5E00]">{req.campaignTitle}</p>
                      <p>{req.message}</p>
                    </div>
                    <button
                      onClick={() => openRequestPopup(req)}
                      className="text-xs font-semibold uppercase tracking-wide text-[#C05621]"
                    >
                      Details
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-amber-700">Requested {formatRequestTime(req.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification center */}
        {verificationQueue.length > 0 && (
          <section className="mb-10 rounded-3xl border border-[#CFE7E7] bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
                  Verification Center
                </p>
                <h2 className="text-2xl font-semibold text-[#003d3b]">
                  Pending actions ({verificationQueue.length})
                </h2>
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                Upload the supporting documents the admin requested so your campaign can go live faster.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {verificationQueue.map((req) => {
                const meta = requestStatusStyles[req.status] || requestStatusStyles.pending;
                return (
                  <div
                    key={`${req.campaignId}-${req._id}`}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase text-gray-500">Campaign</p>
                        <p className="text-lg font-semibold text-[#003d3b]">{req.campaignTitle}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${meta.pill}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-700">{req.message}</p>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Timeline</p>
                      <ul className="mt-2 space-y-3">
                        <li className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-3 text-sm text-[#8B5E00]">
                          <p className="font-semibold">Admin requested clarification</p>
                          <p className="text-xs text-amber-700 mt-1">{formatFullDate(req.createdAt)}</p>
                        </li>
                        {Array.isArray(req.responses) &&
                          req.responses.map((resp, idx) => (
                            <li
                              key={`${req._id}-resp-${idx}`}
                              className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-[#003d3b]"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">
                                  {resp.uploadedByName || "You"} submitted documents
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatFullDate(resp.uploadedAt)}
                                </span>
                              </div>
                              {resp.note && (
                                <p className="mt-2 text-gray-600 whitespace-pre-line">{resp.note}</p>
                              )}
                              {Array.isArray(resp.documents) && resp.documents.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {resp.documents.map((doc, fileIdx) => (
                                    <a
                                      key={`${req._id}-resp-${idx}-doc-${fileIdx}`}
                                      href={resolveImg(doc)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group inline-flex items-center gap-2 rounded-xl border border-[#CFE7E7] bg-white px-3 py-1 text-xs font-semibold text-[#005A58] hover:border-[#00B5B8]"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-[#00B5B8]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1.5}
                                          d="M7 7h10M7 12h6m-2 7l-4-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-4l-4 4z"
                                        />
                                      </svg>
                                      <span className="truncate max-w-[120px]">{fileLabel(doc)}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-xs text-gray-500">
                        Last updated {formatRequestTime(req.respondedAt || req.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/edit-campaign/${req.campaignId}`}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Edit campaign form
                        </Link>
                        <button
                          onClick={() => openRespondModal(req.campaign, req)}
                          className="rounded-xl bg-[#00B5B8] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#009ea1] transition"
                        >
                          {req.status === "pending" ? "Upload documents" : "Add more proofs"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Stats */}
        {Array.isArray(myCampaigns) && myCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#00B5B8]">{myCampaigns.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Fundraisers</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#00897B]">
                {myCampaigns.filter((c) => c.status === "approved").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Approved</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#F9A826]">
                ₹{myCampaigns.reduce((sum, c) => sum + (Number(c.raisedAmount) || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Raised</div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        {!Array.isArray(myCampaigns) || myCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="text-xl font-semibold text-[#003d3b] mb-2">No Fundraisers Yet</h3>
            <p className="text-gray-600 mb-6">Start your first fundraising campaign and make a difference</p>
            <Link
              to="/create-campaign"
              className="inline-block bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Create Fundraiser
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCampaigns.map((c) => {
              // CRITICAL: Always use imageUrl from backend (virtual field) first
              let img = c?.imageUrl;
              if (!img || img === "null" || img === null) {
                img = getImageUrl(c);
              }
              if (!img || img === "null" || img === null) {
                img = "/no-image.png";
              }
              const raised = Number(c.raisedAmount || 0);
              const goal = Math.max(1, Number(c.goalAmount || 0));
              const percentage = Math.min(100, Math.round((raised / goal) * 100));
              const status = c.status === "approved" ? "Approved" : "Pending Approval";
              const statusColor =
                c.status === "approved" ? "bg-[#00897B] text-white" : "bg-[#F9A826] text-white";
              const pendingRequest = Array.isArray(c.infoRequests)
                ? c.infoRequests.find((req) => req.status !== "resolved")
                : null;
              const requestMeta = pendingRequest
                ? requestStatusStyles[pendingRequest.status] || requestStatusStyles.pending
                : null;

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col min-h-[480px] hover:shadow-xl transition"
                >
                  {/* Image */}
                  <div className="h-48 w-full overflow-hidden bg-gray-200">
                    {img && img !== "/no-image.png" ? (
                      <img
                        src={resolveImg(c.image || c.imageUrl)}
                        alt={c.title}
                        onError={(e) => {
                          // If image fails to load, try fallback
                          if (e.currentTarget.src !== "/no-image.png") {
                            e.currentTarget.src = "/no-image.png";
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    {/* Status & Category */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
                        {status}
                      </span>
                      {c.category && (
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full uppercase">
                          {c.category}
                        </span>
                      )}
                    </div>

                    {/* Zakat Badge */}
                    {c.zakatEligible && (
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                          ✓ Zakat Eligible
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 min-h-[3rem]">
                      {c.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">{c.shortDescription || "No description provided."}</p>

                    {pendingRequest && (
                      <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#8B5E00]">Verification update</p>
                          {requestMeta && (
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${requestMeta.badge}`}
                            >
                              {requestMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-gray-800">{pendingRequest.message}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            onClick={() => openRespondModal(c, pendingRequest)}
                            className="inline-flex items-center justify-center rounded-lg bg-[#00B5B8] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#009ea1] transition"
                          >
                            Upload documents
                          </button>
                          <button
                            onClick={() =>
                              openRequestPopup({
                                ...pendingRequest,
                                campaignId: c._id,
                                campaignTitle: c.title,
                              })
                            }
                            className="text-xs font-semibold uppercase tracking-wide text-[#C05621]"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, background: "#00B5B8" }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-[#003d3b]">
                        <span>₹{raised.toLocaleString()}</span>
                        <span>of ₹{goal.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">{percentage}% funded</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/campaign/${c._id}`}
                        className="flex-1 bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold py-2.5 px-4 rounded-xl text-center transition text-sm"
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

        {/* CTA */}
        {Array.isArray(myCampaigns) && myCampaigns.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/create-campaign"
              className="inline-block bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold px-8 py-3 rounded-xl transition shadow-md"
            >
              + Create New Fundraiser
            </Link>
          </div>
        )}
    </div>

    {responseModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00B5B8]">
                Respond to admin
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#003d3b]">Send supporting documents</h2>
              <p className="text-sm text-gray-500 mt-1">
                {responseModal.campaign?.title}
              </p>
            </div>
            <button
              onClick={closeRespondModal}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="text-xs uppercase tracking-wide text-gray-500">Admin message</p>
              <p className="mt-2">{responseModal.request?.message}</p>
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
                placeholder="Explain what documents you're attaching so the admin can verify quickly."
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
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

            {Array.isArray(responseModal.request?.responses) &&
              responseModal.request.responses.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Previous submissions
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#003d3b]">
                    {responseModal.request.responses.map((resp, idx) => (
                      <li key={`${resp._id || idx}`} className="rounded-2xl border border-white bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{resp.uploadedByName || "You"}</span>
                          <span className="text-xs text-gray-500">{formatFullDate(resp.uploadedAt)}</span>
                        </div>
                        {resp.note && <p className="mt-2 text-gray-600">{resp.note}</p>}
                        {Array.isArray(resp.documents) && resp.documents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {resp.documents.map((doc, fileIdx) => (
                              <a
                                key={`${resp._id || idx}-doc-${fileIdx}`}
                                href={resolveImg(doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-[#CFE7E7] bg-white px-3 py-1 text-xs font-semibold text-[#005A58]"
                              >
                                {fileLabel(doc)}
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {responseError && <p className="text-sm text-red-600">{responseError}</p>}

            <div className="flex flex-wrap justify-end gap-3">
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

    {showRequestPopup && activeRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00B5B8]">
              Admin request
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#003d3b]">Please upload the required documents.</h2>
            <p className="mt-2 text-sm text-gray-600">
              Admin request: Please upload the required documents.
            </p>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500">Campaign</p>
              <p className="font-semibold text-[#003d3b]">{activeRequest.campaignTitle}</p>
              <p className="mt-3">{activeRequest.message}</p>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              You can reply to this request by opening the campaign from your dashboard and uploading the
              missing details or documents.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRequestPopup(false)}
                className="rounded-md bg-[#00B5B8] px-5 py-2 text-sm font-semibold text-white shadow"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}