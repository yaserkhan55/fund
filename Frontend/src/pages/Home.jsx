// src/pages/Home.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import Hero from "../components/Hero";
import TrendingFundraisers from "../components/TrendingFundraisers";
import SuccessStories from "../components/SuccessStories";
import FAQ from "../components/FAQ";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

function Home() {
  const { isSignedIn, getToken } = useAuth();
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

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

  // Auto-show popup when admin requests are found (every time user visits)
  useEffect(() => {
    if (!loading && adminRequests.length > 0 && isSignedIn) {
      // Always show the most recent pending request
      const mostRecent = adminRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      })[0];
      
      setActiveRequest(mostRecent);
      setShowRequestPopup(true);
    }
  }, [loading, adminRequests, isSignedIn]);

  // Auto-show popup when admin actions are found (approve/reject/delete)
  useEffect(() => {
    if (!loading && adminActions.length > 0 && isSignedIn) {
      // Always show the most recent action
      const mostRecent = adminActions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      })[0];
      
      setActiveAction(mostRecent);
      setShowActionPopup(true);
    }
  }, [loading, adminActions, isSignedIn]);

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
              You can respond to this request by going to your profile and editing the campaign.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowRequestPopup(false)}
                className="rounded-md bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition"
              >
                Remind me later
              </button>
              <a
                href="/profile"
                className="rounded-md bg-[#00B5B8] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#009f9f] transition"
              >
                Go to Profile
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Popup - Shows approve/reject/delete notifications */}
      {showActionPopup && activeAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in ${
            activeAction.action === "approved" 
              ? "bg-green-50 border-2 border-green-500" 
              : "bg-red-50 border-2 border-red-500"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${
                activeAction.action === "approved" ? "text-green-700" : "text-red-700"
              }`}>
                {activeAction.action === "approved" ? "Campaign Approved" : 
                 activeAction.action === "rejected" ? "Campaign Rejected" : 
                 "Campaign Deleted"}
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
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <h2 className={`mt-2 text-2xl font-bold ${
              activeAction.action === "approved" ? "text-green-800" : "text-red-800"
            }`}>
              {activeAction.action === "approved" 
                ? "✓ Your campaign has been approved!" 
                : activeAction.action === "rejected"
                ? "✗ Your campaign has been rejected"
                : "✗ Your campaign has been deleted"}
            </h2>
            
            <div className={`mt-4 rounded-xl border p-4 text-sm ${
              activeAction.action === "approved" 
                ? "border-green-200 bg-green-100 text-green-900" 
                : "border-red-200 bg-red-100 text-red-900"
            }`}>
              <p className="text-xs uppercase tracking-wide mb-2">Campaign</p>
              <p className="font-semibold mb-3">{activeAction.campaignTitle}</p>
              <p>{activeAction.message || (activeAction.action === "approved" 
                ? "Your campaign is now live and visible to all users!" 
                : "Please review the requirements and contact support if needed.")}</p>
            </div>

            <p className="mt-4 text-xs text-gray-600">
              {activeAction.action === "approved" ? "Approved" : 
               activeAction.action === "rejected" ? "Rejected" : "Deleted"} {formatRequestTime(activeAction.createdAt)}
            </p>

            <div className="mt-6 flex justify-end gap-2">
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
                className={`rounded-md px-5 py-2 text-sm font-semibold text-white shadow transition ${
                  activeAction.action === "approved" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
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
