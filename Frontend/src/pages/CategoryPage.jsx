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
    <div className="w-[90%] mx-auto mt-20 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#003d3b] mb-2">
            {formatCategoryName(category)} Fundraisers
          </h1>
          <p className="text-gray-600">
            {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"} found
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 text-sm font-semibold text-[#00B5B8] hover:text-[#009EA1] transition"
        >
          ← Back to Home
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="p-10 text-center bg-[#FFFBF0] border border-[#F9A826] rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F9A826]/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#F9A826]"
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
          <p className="text-[#003d3b] text-lg font-semibold mb-2">
            No campaigns found in this category
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Check back later or explore other categories
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
          >
            Browse All Campaigns
          </button>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const progress =
            c.goalAmount > 0
              ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100)
              : 0;

          return (
            <Link
              key={c._id}
              to={`/campaign/${c._id}`}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-[500px] block border border-[#E0F2F2] relative group"
            >
              {/* Subtle light effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00B5B8]/0 via-[#00B5B8]/0 to-[#00B5B8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
              
              <div className="h-[200px] w-full overflow-hidden bg-gray-200">
                <img
                  src={resolveImg(c.image || c.imageUrl)}
                  alt={c.title}
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.src = "/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg")}
                />
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  {c.category && (
                    <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-full">
                      {c.category}
                    </span>
                  )}
                  {c.zakatEligible && (
                    <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                      ✓ Zakat Eligible
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#003d3b] mb-2 line-clamp-2">
                  {c.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {c.shortDescription || "No description available."}
                </p>

                <div className="mt-auto">
                  <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: "#F9A826",
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm font-semibold text-[#003d3b] mb-4">
                    <span>₹{(c.raisedAmount || 0).toLocaleString()}</span>
                    <span>of ₹{(c.goalAmount || 0).toLocaleString()}</span>
                  </div>

                  <div className="block text-center bg-[#00B5B8] hover:bg-[#009EA1] text-white py-2.5 rounded-xl font-semibold transition">
                    View Details • مزید معلومات
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
