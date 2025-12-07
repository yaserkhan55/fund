import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import FlowChart from "./FlowChart";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Hero() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    livesSaved: 0,
    contributors: 0,
    totalCampaigns: 0,
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
          livesSaved: res.data.stats.livesImpacted || res.data.stats.livesSaved || 0,
          contributors: res.data.stats.contributors || 0,
          totalCampaigns: res.data.stats.totalCampaigns || 0,
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
    <section className="w-full bg-gradient-to-br from-[#E6F7F7] via-[#F0FAFA] to-white pt-28 pb-20 px-4 overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00B5B8] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#009EA1] rounded-full blur-3xl"></div>
      </div>

      {/* Wrapper */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-14 relative z-10">

        {/* LEFT SIDE */}
        <div className="flex-1 animate-fadeInUp">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#003D3B] leading-tight">
            Become a <br />
            <span className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] bg-clip-text text-transparent">
              Changemaker!
            </span>
          </h1>

          <p className="text-gray-700 text-lg md:text-xl mt-6 leading-relaxed max-w-xl">
            Start your journey with your first contribution. Every donation makes a real difference in someone's life.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => {
                if (!isSignedIn) {
                  localStorage.setItem("donationAuthMessage", "For donation, first you have to create account");
                  navigate("/sign-up");
                } else {
                  navigate("/browse");
                }
              }}
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#00B5B8] via-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:via-[#009EA1] hover:to-[#008B8E] text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Donate Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
            </button>
          </div>

          {/* STATS */}
          <div className="flex flex-wrap gap-8 md:gap-12 mt-14">
            <div className="text-left group">
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-bold text-[#003D3B] transition-transform group-hover:scale-110 duration-300">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    formatNumber(stats.livesSaved)
                  )}
                </h2>
                <span className="text-2xl text-[#00B5B8]">+</span>
              </div>
              <p className="text-gray-600 mt-2 font-medium">Lives Saved</p>
              <div className="w-12 h-1 bg-gradient-to-r from-[#00B5B8] to-transparent mt-2 rounded-full"></div>
            </div>

            <div className="text-left group">
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-bold text-[#003D3B] transition-transform group-hover:scale-110 duration-300">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    formatNumber(stats.contributors)
                  )}
                </h2>
                <span className="text-2xl text-[#00B5B8]">+</span>
              </div>
              <p className="text-gray-600 mt-2 font-medium">Contributors</p>
              <div className="w-12 h-1 bg-gradient-to-r from-[#00B5B8] to-transparent mt-2 rounded-full"></div>
            </div>

            <div className="text-left group">
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-bold text-[#003D3B] transition-transform group-hover:scale-110 duration-300">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
                  ) : (
                    formatNumber(stats.totalCampaigns)
                  )}
                </h2>
                <span className="text-2xl text-[#00B5B8]">+</span>
              </div>
              <p className="text-gray-600 mt-2 font-medium">Total Campaigns</p>
              <div className="w-12 h-1 bg-gradient-to-r from-[#00B5B8] to-transparent mt-2 rounded-full"></div>
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
