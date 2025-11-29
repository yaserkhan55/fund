// src/pages/Home.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import Hero from "../components/Hero";
import TrendingFundraisers from "../components/TrendingFundraisers";
import SuccessStories from "../components/SuccessStories";
import FAQ from "../components/FAQ";

// Auto-dismiss component for notifications
function NotificationAutoDismiss({ onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [onDismiss]);
  return null;
}

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

function Home() {
  const { isSignedIn, getToken } = useAuth();
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  // Fetch user's campaigns to check for admin requests
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        
        // Try Clerk token first, fallback to localStorage token
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }
        
        if (!token) {
          console.log("No token found");
          return;
        }

        const res = await axios.get(`${API_URL}/api/campaigns/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
        console.log("Fetched campaigns:", list.length);
        console.log("Campaigns with infoRequests:", list.filter(c => c.infoRequests?.length > 0));
        
        setMyCampaigns(list);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        console.error("Error details:", err.response?.data);
        setMyCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [isSignedIn, getToken]);

  // Extract admin requests from campaigns
  const adminRequests = useMemo(() => {
    if (!Array.isArray(myCampaigns)) {
      console.log("myCampaigns is not an array:", myCampaigns);
      return [];
    }

    const requests = myCampaigns.flatMap((campaign) => {
      if (!Array.isArray(campaign.infoRequests)) {
        return [];
      }

      return campaign.infoRequests
        .filter((req) => req.status === "pending")
        .map((req) => ({
          ...req,
          campaignId: campaign._id,
          campaignTitle: campaign.title,
        }));
    });
    
    console.log("Found admin requests:", requests.length);
    return requests;
  }, [myCampaigns]);

  // Extract admin actions (approve/reject/delete) from campaigns
  const adminActions = useMemo(() => {
    if (!Array.isArray(myCampaigns)) {
      return [];
    }

    const actions = myCampaigns.flatMap((campaign) => {
      if (!Array.isArray(campaign.adminActions)) {
        return [];
      }

      return campaign.adminActions
        .filter((action) => !action.viewed)
        .map((action) => ({
          ...action,
          _id: action._id || action.id,
          campaignId: campaign._id,
          campaignTitle: campaign.title,
        }));
    });
    
    console.log("Found admin actions:", actions.length);
    return actions;
  }, [myCampaigns]);

  // Fetch latest notification from API
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchLatestNotification = async () => {
      try {
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }
        
        if (!token) return;

        const res = await axios.get(`${API_URL}/api/campaigns/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const notifications = res.data?.notifications || [];
        console.log("=== NOTIFICATION FETCH ===");
        console.log("Total notifications:", notifications.length);
        console.log("Contact replies:", notifications.filter(n => n.type === "contact_reply").length);
        console.log("All notifications:", notifications);
        console.log("==========================");
        
        if (notifications.length > 0) {
          // Prioritize contact_reply notifications, then filter unviewed
          const contactReplies = notifications.filter(n => n.type === "contact_reply" && !n.viewed);
          const otherNotifications = notifications.filter(n => n.type !== "contact_reply" && !n.viewed);
          
          // Combine: contact replies first, then others
          const unviewedNotifications = [...contactReplies, ...otherNotifications];
          
          if (unviewedNotifications.length > 0) {
            const latest = unviewedNotifications[0]; // Already sorted by newest first
            console.log("Latest notification to show:", latest);
            
            // Check if this notification has been shown before
            const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
            
            // For contact replies, use contactId + createdAt to allow new replies to show
            // For other notifications, use the full key
            let notificationKey;
            if (latest.type === "contact_reply") {
              // For contact replies, check if we've shown ANY notification for this contact
              // This allows new admin replies to the same contact to show
              const contactNotificationKeys = shownNotifications.filter(key => 
                key.startsWith(`contact_reply_contact_${latest.contactId}_`)
              );
              
              // If we have shown notifications for this contact, check if this one is newer
              if (contactNotificationKeys.length > 0) {
                // Extract timestamps from shown keys
                const shownTimestamps = contactNotificationKeys.map(key => {
                  const parts = key.split('_');
                  return parts[parts.length - 1]; // Last part is timestamp
                });
                
                const latestTimestamp = new Date(latest.createdAt).getTime();
                const maxShownTimestamp = Math.max(...shownTimestamps.map(ts => new Date(ts).getTime()));
                
                // Only show if this notification is newer than what we've shown
                if (latestTimestamp > maxShownTimestamp) {
                  notificationKey = `${latest.type}_${latest.id}_${latest.createdAt}`;
                } else {
                  notificationKey = null; // Already shown a newer or same notification
                }
              } else {
                // No previous notifications for this contact, show it
                notificationKey = `${latest.type}_${latest.id}_${latest.createdAt}`;
              }
            } else {
              // For other notification types, use the standard key
              notificationKey = `${latest.type}_${latest.id}_${latest.createdAt}`;
            }
            
            if (notificationKey && !shownNotifications.includes(notificationKey)) {
              console.log("Showing notification popup:", latest.type, latest.message);
              setLatestNotification(latest);
              setShowNotificationPopup(true);
              // Mark as shown
              shownNotifications.push(notificationKey);
              // Keep only last 50 shown notifications
              if (shownNotifications.length > 50) {
                shownNotifications.shift();
              }
              localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
            } else if (notificationKey === null) {
              console.log("Contact reply already shown (newer notification exists)");
            } else {
              console.log("Notification already shown:", notificationKey);
            }
          } else {
            console.log("No unviewed notifications found");
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchLatestNotification();
  }, [isSignedIn, getToken]);

  // Auto-show popup when admin requests are found (only if not already shown)
  useEffect(() => {
    if (!loading && adminRequests.length > 0 && isSignedIn && !showNotificationPopup) {
      const mostRecent = adminRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      })[0];
      
      // Check if this request has been shown
      const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
      const requestKey = `info_request_${mostRecent._id || mostRecent.id}_${mostRecent.createdAt}`;
      
      if (!shownNotifications.includes(requestKey)) {
        setActiveRequest(mostRecent);
        setShowRequestPopup(true);
        shownNotifications.push(requestKey);
        if (shownNotifications.length > 50) shownNotifications.shift();
        localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
      }
    }
  }, [loading, adminRequests, isSignedIn, showNotificationPopup]);

  // Auto-show popup when admin actions are found (only if not already shown)
  useEffect(() => {
    if (!loading && adminActions.length > 0 && isSignedIn && !showNotificationPopup && !showRequestPopup) {
      const mostRecent = adminActions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      })[0];
      
      // Check if this action has been shown
      const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
      const actionKey = `admin_action_${mostRecent._id || mostRecent.id}_${mostRecent.createdAt}`;
      
      if (!shownNotifications.includes(actionKey)) {
        setActiveAction(mostRecent);
        setShowActionPopup(true);
        shownNotifications.push(actionKey);
        if (shownNotifications.length > 50) shownNotifications.shift();
        localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
      }
    }
  }, [loading, adminActions, isSignedIn, showNotificationPopup, showRequestPopup]);

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

  return (
    <>
      <Hero />

      <TrendingFundraisers />
      <SuccessStories />
      <FAQ />

      {/* Admin Request Popup - Shows on Home Page */}
      {showRequestPopup && activeRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00B5B8]">
                Admin Request
              </p>
              <button
                onClick={() => setShowRequestPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <h2 className="mt-2 text-2xl font-bold text-[#003d3b]">
              Please upload the required documents.
            </h2>
            
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Campaign</p>
              <p className="font-semibold text-[#003d3b] mb-3">{activeRequest.campaignTitle}</p>
              <p className="text-gray-700">{activeRequest.message}</p>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Requested {formatRequestTime(activeRequest.createdAt)}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              You can respond to this request by going to your dashboard and editing the campaign.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowRequestPopup(false)}
                className="rounded-md bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition"
              >
                Remind me later
              </button>
              <a
                href="/dashboard"
                className="rounded-md bg-[#00B5B8] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#009f9f] transition"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Small Notification Popup - Latest notification */}
      {showNotificationPopup && latestNotification && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#E0F2F2] p-4 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00B5B8]/10 rounded-full flex items-center justify-center">
              <span className="text-[#00B5B8] text-lg">
                {latestNotification.type === "contact_reply" ? "💬" :
                 latestNotification.type === "info_request" ? "📋" :
                 latestNotification.type === "admin_action" ? "✅" : "🔔"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#00B5B8] uppercase tracking-wide mb-1">
                {latestNotification.type === "contact_reply" ? "Admin Reply" :
                 latestNotification.type === "info_request" ? "Info Request" :
                 "Notification"}
              </p>
              <p className="text-sm font-semibold text-[#003d3b] line-clamp-2">
                {latestNotification.message}
              </p>
              {latestNotification.campaignTitle && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {latestNotification.campaignTitle}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowNotificationPopup(false);
                setLatestNotification(null);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Auto-dismiss notification after 5 seconds */}
      {showNotificationPopup && latestNotification && (
        <NotificationAutoDismiss
          onDismiss={() => {
            setShowNotificationPopup(false);
            setLatestNotification(null);
          }}
        />
      )}

      {/* Admin Action Popup - Shows approve/reject/delete notifications */}
      {showActionPopup && activeAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
          <div className={`w-full max-w-sm rounded-xl p-5 shadow-2xl ${
            activeAction.action === "approved" 
              ? "bg-green-50 border border-green-300" 
              : "bg-red-50 border border-red-300"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                activeAction.action === "approved" ? "text-green-700" : "text-red-700"
              }`}>
                {activeAction.action === "approved" ? "Approved" : 
                 activeAction.action === "rejected" ? "Rejected" : 
                 "Deleted"}
              </p>
              <button
                onClick={async () => {
                  // Mark as viewed
                  try {
                    let token = null;
                    try {
                      token = await getToken();
                    } catch (e) {
                      token = localStorage.getItem("token");
                    }
                    
                    if (token && activeAction.campaignId && activeAction._id) {
                      await axios.put(
                        `${API_URL}/api/campaigns/${activeAction.campaignId}/admin-actions/${activeAction._id}/view`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }
                  } catch (err) {
                    console.error("Error marking action as viewed:", err);
                  }
                  setShowActionPopup(false);
                  setActiveAction(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activeAction.action === "approved" ? "bg-green-500" : "bg-red-500"
              }`}>
                {activeAction.action === "approved" ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${
                  activeAction.action === "approved" ? "text-green-800" : "text-red-800"
                }`}>
                  {activeAction.action === "approved" 
                    ? "Campaign Approved" 
                    : activeAction.action === "rejected"
                    ? "Campaign Rejected"
                    : "Campaign Deleted"}
                </h2>
                <p className="text-xs text-gray-600 mt-1">{activeAction.campaignTitle}</p>
              </div>
            </div>
            
            {/* Only show the latest message for rejected campaigns */}
            {activeAction.message && (
              <div className={`rounded-lg border p-3 text-sm mb-3 ${
                activeAction.action === "approved" 
                  ? "border-green-200 bg-white text-green-900" 
                  : "border-red-200 bg-white text-red-900"
              }`}>
                <p className="text-xs">{activeAction.message}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={async () => {
                  // Mark as viewed
                  try {
                    let token = null;
                    try {
                      token = await getToken();
                    } catch (e) {
                      token = localStorage.getItem("token");
                    }
                    
                    if (token && activeAction.campaignId && activeAction._id) {
                      await axios.put(
                        `${API_URL}/api/campaigns/${activeAction.campaignId}/admin-actions/${activeAction._id}/view`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }
                  } catch (err) {
                    console.error("Error marking action as viewed:", err);
                  }
                  setShowActionPopup(false);
                  setActiveAction(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeAction.action === "approved" 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
