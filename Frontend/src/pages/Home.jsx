// src/pages/Home.jsx

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
      if (onDismiss) {
        onDismiss();
      }
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run once when component mounts
  return null;
}

// Minimal sound effect for notification
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Pleasant tone
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Very quiet
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Silently fail if audio context is not available
    console.log("Audio not available");
  }
}

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

function Home() {
  const { isSignedIn, getToken, user } = useAuth();
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [showDonationThanksPopup, setShowDonationThanksPopup] = useState(false);
  const [approvedDonation, setApprovedDonation] = useState(null);
  const [showDonationThanksPopup, setShowDonationThanksPopup] = useState(false);
  const [approvedDonation, setApprovedDonation] = useState(null);

  // Use refs to track if we've already processed notifications (prevents infinite loops)
  const processedRequestsRef = useRef(new Set());
  const processedActionsRef = useRef(new Set());
  const requestsEffectRanRef = useRef(false);
  const actionsEffectRanRef = useRef(false);
  const checkedDonationsRef = useRef(false);

  // Fetch user's campaigns to check for admin requests
  useEffect(() => {
    if (!isSignedIn) {
      setMyCampaigns([]);
      return;
    }

    let isMounted = true;

    const fetchCampaigns = async () => {
      try {
        if (isMounted) setLoading(true);
        
        // Try Clerk token first, fallback to localStorage token
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }
        
        if (!token || !isMounted) {
          return;
        }

        const res = await axios.get(`${API_URL}/api/campaigns/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!isMounted) return;
        
        const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
        
        if (isMounted) {
          setMyCampaigns(list);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        if (isMounted) {
          setMyCampaigns([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]); // Only depend on isSignedIn, not getToken

  // Extract admin requests from campaigns - Memoized to prevent recalculation
  const adminRequests = useMemo(() => {
    if (!Array.isArray(myCampaigns) || myCampaigns.length === 0) {
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
    
    return requests;
  }, [myCampaigns]);

  // Extract admin actions (approve/reject/delete) from campaigns - Memoized
  const adminActions = useMemo(() => {
    if (!Array.isArray(myCampaigns) || myCampaigns.length === 0) {
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
    
    return actions;
  }, [myCampaigns]);

  // Fetch latest notification from API - Poll periodically to catch new admin actions
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let isMounted = true;
    let intervalId = null;

    const fetchLatestNotification = async () => {
      if (!isMounted) return;
      
      try {
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }
        
        if (!token || !isMounted) {
          return;
        }

        const res = await axios.get(`${API_URL}/api/campaigns/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        const notifications = res.data?.notifications || [];
        
        // Also check for admin actions from campaigns
        const adminActionsFromCampaigns = myCampaigns.flatMap((campaign) => {
          if (!Array.isArray(campaign.adminActions)) return [];
          return campaign.adminActions
            .filter((action) => !action.viewed)
            .map((action) => ({
              type: "admin_action",
              id: action._id || action.id,
              action: action.action,
              message: action.message || (action.action === "approved" 
                ? "Your campaign has been approved and is now live!" 
                : action.action === "rejected"
                ? "Your campaign has been rejected. Please review the requirements."
                : "Your campaign has been deleted."),
              campaignId: campaign._id,
              campaignTitle: campaign.title,
              createdAt: action.createdAt || new Date(),
              viewed: action.viewed || false,
            }));
        });

        // Combine API notifications with admin actions
        const allNotifications = [...notifications, ...adminActionsFromCampaigns];
        
        if (allNotifications.length > 0 && isMounted) {
          // Prioritize admin actions (approve/reject), then contact_reply, then others
          const adminActions = allNotifications.filter(n => n.type === "admin_action" && !n.viewed);
          const contactReplies = allNotifications.filter(n => n.type === "contact_reply" && !n.viewed);
          const otherNotifications = allNotifications.filter(n => n.type !== "contact_reply" && n.type !== "admin_action" && !n.viewed);
          
          // Combine: admin actions first, contact replies second, then others
          const unviewedNotifications = [...adminActions, ...contactReplies, ...otherNotifications];
          
          if (unviewedNotifications.length > 0 && isMounted && !showNotificationPopup && !showActionPopup) {
            const latest = unviewedNotifications[0];
            
            // Check if this notification has been shown before
            const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
            
            // Generate notification key
            let notificationKey;
            if (latest.type === "admin_action") {
              notificationKey = `admin_action_${latest.action}_${latest.campaignId}_${latest.id}_${latest.createdAt}`;
            } else if (latest.type === "contact_reply") {
              notificationKey = `contact_reply_${latest.contactId}_${latest.createdAt}`;
            } else {
              notificationKey = `${latest.type}_${latest.id}_${latest.createdAt}`;
            }
            
            // Check if notification was already dismissed
            const dismissedNotifications = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
            const isDismissed = dismissedNotifications.includes(notificationKey);
            
            if (notificationKey && !shownNotifications.includes(notificationKey) && !isDismissed && isMounted) {
              if (latest.type === "admin_action") {
                // Show admin action popup
                setActiveAction({
                  ...latest,
                  _id: latest.id,
                });
                setShowActionPopup(true);
              } else {
                setLatestNotification(latest);
                setShowNotificationPopup(true);
              }
              playNotificationSound();
              // Mark as shown immediately to prevent re-showing
              shownNotifications.push(notificationKey);
              if (shownNotifications.length > 50) {
                shownNotifications.shift();
              }
              localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
            } else if (notificationKey && shownNotifications.includes(notificationKey)) {
              // If already shown, don't show again
              if (isMounted) {
                if (latest.type === "admin_action") {
                  setShowActionPopup(false);
                  setActiveAction(null);
                } else {
                  setShowNotificationPopup(false);
                  setLatestNotification(null);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("[Home Notifications] Error fetching notifications:", err);
      }
    };

    // Fetch immediately
    fetchLatestNotification();
    
    // Poll every 15 seconds to catch new admin actions (delete/reject/approve)
    intervalId = setInterval(() => {
      if (isMounted && !showNotificationPopup && !showActionPopup) {
        fetchLatestNotification();
      }
    }, 15000); // 15 seconds for faster response
    
    // Also fetch when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted && !showNotificationPopup && !showActionPopup) {
        fetchLatestNotification();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, myCampaigns]); // Depend on myCampaigns to catch admin actions

  // Auto-show popup when admin requests are found (only if not already shown)
  // DISABLED - This was causing infinite loops. Use notification system instead.
  // useEffect(() => {
  //   // Only run once per session
  //   if (requestsEffectRanRef.current || loading || adminRequests.length === 0 || !isSignedIn || showNotificationPopup || showRequestPopup) {
  //     return;
  //   }

  //   requestsEffectRanRef.current = true;

  //   const mostRecent = [...adminRequests].sort((a, b) => {
  //     const dateA = new Date(a.createdAt || 0);
  //     const dateB = new Date(b.createdAt || 0);
  //     return dateB - dateA;
  //   })[0];
    
  //   if (!mostRecent) return;
    
  //   const requestKey = `info_request_${mostRecent._id || mostRecent.id}_${mostRecent.createdAt}`;
    
  //   // Check if we've already processed this request in this session
  //   if (processedRequestsRef.current.has(requestKey)) {
  //     return;
  //   }
    
  //   // Check if this request has been shown (persistent check)
  //   const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
    
  //   if (!shownNotifications.includes(requestKey)) {
  //     processedRequestsRef.current.add(requestKey);
  //     setActiveRequest(mostRecent);
  //     setShowRequestPopup(true);
  //     shownNotifications.push(requestKey);
  //     if (shownNotifications.length > 50) {
  //       shownNotifications.shift();
  //     }
  //     localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
  //   }
  // }, [loading, adminRequests.length, isSignedIn, showNotificationPopup, showRequestPopup]);

  // Auto-show popup when admin actions are found (only if not already shown)
  // DISABLED - This was causing infinite loops. Use notification system instead.
  // useEffect(() => {
  //   // Only run once per session
  //   if (actionsEffectRanRef.current || loading || adminActions.length === 0 || !isSignedIn || showNotificationPopup || showRequestPopup || showActionPopup) {
  //     return;
  //   }

  //   actionsEffectRanRef.current = true;

  //   const mostRecent = [...adminActions].sort((a, b) => {
  //     const dateA = new Date(a.createdAt || 0);
  //     const dateB = new Date(b.createdAt || 0);
  //     return dateB - dateA;
  //   })[0];
    
  //   if (!mostRecent) return;
    
  //   const actionKey = `admin_action_${mostRecent._id || mostRecent.id}_${mostRecent.createdAt}`;
    
  //   // Check if we've already processed this action in this session
  //   if (processedActionsRef.current.has(actionKey)) {
  //     return;
  //   }
    
  //   // Check if this action has been shown (persistent check)
  //   const shownNotifications = JSON.parse(localStorage.getItem("shownNotifications") || "[]");
    
  //   if (!shownNotifications.includes(actionKey)) {
  //     processedActionsRef.current.add(actionKey);
  //     setActiveAction(mostRecent);
  //     setShowActionPopup(true);
  //     shownNotifications.push(actionKey);
  //     if (shownNotifications.length > 50) {
  //       shownNotifications.shift();
  //     }
  //     localStorage.setItem("shownNotifications", JSON.stringify(shownNotifications));
  //   }
  // }, [loading, adminActions.length, isSignedIn, showNotificationPopup, showRequestPopup, showActionPopup]);

  // Memoize the dismiss handler to prevent infinite loops
  const handleNotificationDismiss = useCallback(() => {
    setShowNotificationPopup(false);
    setLatestNotification(null);
  }, []);

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
        <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9999 }}>
          <div className="bg-gradient-to-br from-white to-[#E6F8F8] rounded-2xl shadow-2xl border-2 border-[#00B5B8]/30 p-6 max-w-lg w-full transform transition-all duration-300 animate-in fade-in zoom-in">
            {/* Header with icon and close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#00B5B8] to-[#009EA1] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">
                    {latestNotification.type === "contact_reply" ? "💬" :
                     latestNotification.type === "info_request" ? "📋" :
                     latestNotification.type === "admin_action" ? "✅" : "🔔"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#00B5B8] uppercase tracking-wider mb-1">
                    {latestNotification.type === "contact_reply" ? "Admin Reply" :
                     latestNotification.type === "info_request" ? "Info Request" :
                     "Notification"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(latestNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNotificationPopup(false);
                  setLatestNotification(null);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-[#00B5B8] hover:bg-[#00B5B8]/10 rounded-full p-1.5 transition-all duration-200 text-xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Message content */}
            <div className="bg-white/60 rounded-xl p-4 border border-[#E0F2F2]">
              <p className="text-base font-semibold text-[#003d3b] leading-relaxed">
                {latestNotification.message}
              </p>
              {latestNotification.campaignTitle && (
                <div className="mt-3 pt-3 border-t border-[#E0F2F2]">
                  <p className="text-xs text-gray-500 mb-1">Campaign:</p>
                  <p className="text-sm font-medium text-[#00B5B8]">
                    {latestNotification.campaignTitle}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with action button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  // Mark notification as viewed in backend if possible
                  if (latestNotification && latestNotification.id) {
                    // Store in localStorage that this notification was dismissed
                    const dismissedNotifications = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
                    const notificationKey = latestNotification.type === "contact_reply" 
                      ? `contact_reply_${latestNotification.contactId}_${latestNotification.createdAt}`
                      : `${latestNotification.type}_${latestNotification.id}_${latestNotification.createdAt}`;
                    if (!dismissedNotifications.includes(notificationKey)) {
                      dismissedNotifications.push(notificationKey);
                      if (dismissedNotifications.length > 100) {
                        dismissedNotifications.shift();
                      }
                      localStorage.setItem("dismissedNotifications", JSON.stringify(dismissedNotifications));
                    }
                  }
                  setShowNotificationPopup(false);
                  setLatestNotification(null);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-semibold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-dismiss notification after 5 seconds */}
      {showNotificationPopup && latestNotification && (
        <NotificationAutoDismiss
          onDismiss={handleNotificationDismiss}
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
                  
                  // Mark as dismissed in localStorage
                  const actionKey = `admin_action_${activeAction.action}_${activeAction.campaignId}_${activeAction._id}_${activeAction.createdAt}`;
                  const dismissedNotifications = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
                  if (!dismissedNotifications.includes(actionKey)) {
                    dismissedNotifications.push(actionKey);
                    if (dismissedNotifications.length > 100) {
                      dismissedNotifications.shift();
                    }
                    localStorage.setItem("dismissedNotifications", JSON.stringify(dismissedNotifications));
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

      {/* Donation Thanks Popup - Shows when admin approves payment */}
      {showDonationThanksPopup && approvedDonation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-[10000] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-zoom-in">
            <div className="relative overflow-hidden rounded-3xl">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 opacity-20 animate-pulse"></div>
              
              {/* Content */}
              <div className="relative z-10 p-8 text-center">
                {/* Success Icon with Animation */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-zoom-in delay-200">
                    <svg className="w-12 h-12 text-white animate-zoom-in delay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-24 h-24 border-4 border-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-[#003d3b] mb-4 animate-slide-in-bottom delay-600">
                  Thank You for Your Donation! 🎉
                </h3>

                {/* Amount Display */}
                <div className="mb-6 animate-slide-in-bottom delay-800">
                  <div className="inline-block bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white px-6 py-3 rounded-2xl shadow-lg">
                    <p className="text-sm text-white/90 mb-1">Donation Amount</p>
                    <p className="text-3xl font-bold">₹{Number(approvedDonation.amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Campaign Info */}
                {approvedDonation.campaignId && (
                  <div className="mb-4 animate-slide-in-bottom delay-1000">
                    <p className="text-gray-600 text-sm">
                      Campaign: <strong className="text-[#003d3b]">{approvedDonation.campaignId.title || "N/A"}</strong>
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 text-left animate-slide-in-bottom delay-1200">
                  <p className="text-gray-800 text-base leading-relaxed">
                    <strong>Your payment has been received and approved!</strong>
                  </p>
                  <p className="text-gray-700 text-sm mt-2">
                    Thank you for completing your donation. Your contribution will make a real difference and help those in need.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowDonationThanksPopup(false);
                    setApprovedDonation(null);
                  }}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-bold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition-all transform hover:scale-105 shadow-lg animate-slide-in-bottom delay-1400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
