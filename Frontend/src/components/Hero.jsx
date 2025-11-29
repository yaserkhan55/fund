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

        {/* LEFT SIDE */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-[#003D3B] leading-tight">
            Become a <br /> Changemaker!
          </h1>

          <p className="text-gray-700 text-lg mt-4">
            Start your journey with your first contribution.
          </p>

          <Link
            to="/browse"
            className="inline-block mt-6 bg-[#00B5B8] hover:bg-[#009a9c] text-white font-semibold px-7 py-3 rounded-lg shadow-md transition"
          >
            Start Helping →
          </Link>

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
