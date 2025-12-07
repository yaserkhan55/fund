import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import ErrorDisplay from "../components/ErrorDisplay";

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const resolveImg = (img) => {
    if (!img) return "/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const fetchCampaigns = useCallback(async () => {
    if (!category) {
      setError({ message: "Invalid category" });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Minimum delay for smooth loading experience
    const minDelay = new Promise((res) => setTimeout(res, 1000)); // 1 sec

    try {
      const res = await api.get("api/campaigns/approved");

      const all = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];

      // Case-insensitive category filtering
      const filtered = all.filter((c) => {
        const campaignCategory = c.category?.toLowerCase()?.trim();
        const targetCategory = category.toLowerCase()?.trim();
        return campaignCategory === targetCategory;
      });

      // Wait for minimum delay to complete
      await minDelay;

      setCampaigns(filtered);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Category fetch error:", err);
      
      // Only show error if it's not a cached response
      if (!err.__isCached) {
        setError({
          userMessage: err.userMessage || "Failed to load campaigns. Please try again.",
          message: err.message,
          status: err.status,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchCampaigns();
  };

  // Format category name for display
  const formatCategoryName = (cat) => {
    if (!cat) return "";
    return cat
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="w-[90%] mx-auto mt-20 mb-20">
        <h1 className="text-3xl font-bold text-[#003d3b] mb-6">
          {formatCategoryName(category)} Fundraisers
        </h1>
        <ErrorDisplay
          error={error}
          onRetry={handleRetry}
          title="Unable to load campaigns"
          message={error.userMessage || "We couldn't load the campaigns for this category."}
        />
      </div>
    );
  }

  // ---------------------------
  // CUSTOM LOADER WITH CORRECT IMAGE
  // ---------------------------
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-white">
        <img
          src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
          alt="Loading..."
          className="w-28 h-28 object-contain opacity-90 animate-pulse"
        />
      </div>
    );
  }

  return (
    <div className="w-[90%] max-w-7xl mx-auto mt-24 mb-20 animate-fadeInUp">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold mb-2">
            Category
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#003d3b] mb-3">
            {formatCategoryName(category)} <span className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] bg-clip-text text-transparent">Fundraisers</span>
          </h1>
          <p className="text-gray-600 text-lg">
            {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"} found
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="mt-4 md:mt-0 px-6 py-3 text-sm font-semibold text-[#00B5B8] hover:text-white bg-white hover:bg-gradient-to-r hover:from-[#00B5B8] hover:to-[#009EA1] border-2 border-[#00B5B8] rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="p-12 text-center bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E1] border-2 border-[#F9A826]/30 rounded-2xl shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#F9A826]/20 to-[#F9A826]/10 rounded-full flex items-center justify-center animate-pulse-slow">
            <svg
              className="w-10 h-10 text-[#F9A826]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-[#003d3b] text-xl font-bold mb-3">
            No campaigns found in this category
          </p>
          <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
            Check back later or explore other categories to find campaigns that need your support.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-semibold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Browse All Campaigns
          </button>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {campaigns.map((c, index) => {
          const progress =
            c.goalAmount > 0
              ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100)
              : 0;

          return (
            <Link
              key={c._id}
              to={`/campaign/${c._id}`}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col border border-gray-100 relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Subtle light effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00B5B8]/0 via-[#00B5B8]/0 to-[#00B5B8]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
              
              {/* Image Section */}
              <div className="h-52 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative">
                <img
                  src={resolveImg(c.image || c.imageUrl)}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => (e.currentTarget.src = "/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Category Badge */}
                {c.category && (
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold text-white uppercase bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {c.category}
                    </span>
                  </div>
                )}
                
                {/* Zakat Badge */}
                {c.zakatEligible && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-[#00897B] to-[#00695C] px-3 py-1.5 rounded-full shadow-lg">
                      ✓ Zakat
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-[#003d3b] mb-3 line-clamp-2 flex-shrink-0 min-h-[3.5rem] group-hover:text-[#00B5B8] transition-colors duration-300">
                  {c.title}
                </h3>

                <p className="text-sm text-gray-600 mb-5 line-clamp-2 flex-grow min-h-[2.5rem] leading-relaxed">
                  {c.shortDescription || "No description available."}
                </p>

                <div className="mt-auto pt-5 flex-shrink-0 border-t border-gray-100">
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] relative overflow-hidden"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">{Math.round(progress)}% funded</p>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-[#003d3b] mb-4">
                    <div>
                      <span className="text-lg">₹{(c.raisedAmount || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500 font-normal ml-1">raised</span>
                    </div>
                    <span className="text-gray-500 font-medium">
                      of ₹{(c.goalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full text-center bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-3 rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-[1.02] shadow-md hover:shadow-lg relative overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      View Details
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      )}
    </div>
  );
}
