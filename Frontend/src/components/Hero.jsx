import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import FlowChart from "./FlowChart";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Hero() {
  const [stats, setStats] = useState({
    livesSaved: 0,
    contributors: 0,
    trustedCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/campaigns/stats`);
      if (res.data.success) {
        setStats({
          livesSaved: res.data.stats.livesSaved || 0,
          contributors: res.data.stats.contributors || 0,
          trustedCampaigns: res.data.stats.trustedCampaigns || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <section className="w-full bg-[#E6F7F7] pt-28 pb-16 px-4 overflow-hidden">
      {/* Wrapper */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-14">

        {/* LEFT SIDE */}      <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-[#003D3B] leading-tight">
            Become a <br /> Changemaker!
          </h1>

          <p className="text-gray-700 text-lg mt-4">
            Choose your path and make a difference today.
          </p>

          {/* Two Clear Signup Options */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-[#003D3B] mb-4">
              What would you like to do?
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: Create Fundraiser */}
              <Link
                to="/sign-up"
                onClick={() => {
                  // Clear any donor flow flags
                  sessionStorage.removeItem("donorFlow");
                  // Set campaign creator flow
                  sessionStorage.setItem("userFlow", "campaign_creator");
                }}
                className="group relative p-6 bg-white border-2 border-[#00B5B8] rounded-xl hover:border-[#009EA1] hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#003D3B] mb-2 group-hover:text-[#00B5B8] transition-colors">
                      I want to create a fundraiser
                    </h4>
                    <p className="text-sm text-gray-600">
                      Start a campaign to raise funds for your cause
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[#00B5B8] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Option 2: Donate */}
              <Link
                to="/sign-up"
                onClick={() => {
                  // Set donor flow
                  sessionStorage.setItem("donorFlow", "true");
                  sessionStorage.setItem("userFlow", "donor");
                }}
                className="group relative p-6 bg-white border-2 border-[#00B5B8] rounded-xl hover:border-[#009EA1] hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#003D3B] mb-2 group-hover:text-[#00B5B8] transition-colors">
                      I want to donate
                    </h4>
                    <p className="text-sm text-gray-600">
                      Support campaigns and make a difference
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[#00B5B8] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Browse campaigns link (for existing users) */}
            <div className="pt-4">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 text-[#00B5B8] hover:text-[#009EA1] font-medium transition-colors"
              >
                <span>Or browse existing campaigns</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="flex flex-wrap gap-10 mt-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">
                {loading ? "..." : formatNumber(stats.livesSaved)}
              </h2>
              <p className="text-gray-600">Lives Saved</p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">
                {loading ? "..." : formatNumber(stats.contributors)}
              </h2>
              <p className="text-gray-600">Contributors</p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">
                {loading ? "..." : formatNumber(stats.trustedCampaigns)}
              </h2>
              <p className="text-gray-600">Trusted Campaigns</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — FLOW CHART */}
        <div className="flex-1 flex justify-center">
          <FlowChart />
        </div>
      </div>
    </section>
  );
}
