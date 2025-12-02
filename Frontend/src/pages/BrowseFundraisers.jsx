import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function BrowseFundraisers() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);

  const categories = ["all", "medical", "education", "emergency"];

  useEffect(() => {
    fetchAllCampaigns();
    fetchFeaturedCampaigns();
  }, []);

  const fetchAllCampaigns = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/campaigns/approved`);
      setCampaigns(res.data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCampaigns = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/campaigns/featured?limit=6&sortBy=urgent`);
      setFeaturedCampaigns(res.data.campaigns || []);
    } catch (error) {
      console.error("Error fetching featured campaigns:", error);
    }
  };

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.shortDescription?.toLowerCase().includes(query) ||
          c.beneficiaryName?.toLowerCase().includes(query)
      );
    }

    // Sort campaigns
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "trending") {
        return (b.raisedAmount || 0) - (a.raisedAmount || 0);
      } else if (sortBy === "urgent") {
        const progressA = a.goalAmount > 0 ? (a.raisedAmount / a.goalAmount) * 100 : 0;
        const progressB = b.goalAmount > 0 ? (b.raisedAmount / b.goalAmount) * 100 : 0;
        return progressA - progressB; // Lower progress = more urgent
      } else if (sortBy === "goal") {
        return (b.goalAmount || 0) - (a.goalAmount || 0);
      }
      return 0;
    });

    return filtered;
  }, [campaigns, selectedCategory, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003d3b] font-semibold">Loading fundraisers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1FAFA] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-[#00B5B8] hover:text-[#009EA1] font-semibold mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-[#003d3b] mb-2">
            Browse Fundraisers
          </h1>
          <p className="text-gray-600 text-lg">
            Discover campaigns that need your support
          </p>
        </div>

        {/* Featured/Urgent Section */}
        {featuredCampaigns.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#003d3b]">Urgent Campaigns</h2>
                <p className="text-gray-600 text-sm">Campaigns that need immediate support</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCampaigns.map((campaign) => {
                const progress =
                  campaign.goalAmount > 0
                    ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)
                    : 0;
                return (
                  <Link
                    key={campaign._id}
                    to={`/campaign/${campaign._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E0F2F2] hover:shadow-2xl hover:-translate-y-2 hover:border-[#00B5B8] transition-all duration-300 flex flex-col h-full group"
                  >
                    <div className="relative w-full h-48 overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={resolveImg(campaign.image)}
                        alt={campaign.title}
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          URGENT
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                        {campaign.category && (
                          <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-full">
                            {campaign.category}
                          </span>
                        )}
                        {campaign.zakatEligible && (
                          <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                            ✓ Zakat
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 flex-shrink-0 min-h-[3rem]">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow min-h-[2.5rem]">
                        {campaign.shortDescription || "No description available."}
                      </p>
                      <div className="mt-auto flex-shrink-0">
                        <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                          <div
                            className="h-2 rounded-full bg-[#00B5B8] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-[#003d3b] mb-3">
                          <span>₹{(campaign.raisedAmount || 0).toLocaleString()}</span>
                          <span>of ₹{(campaign.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-center bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold transition-all duration-300 group-hover:shadow-lg">
                          مدد کریں (Help Now)
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2] mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
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
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-[#00B5B8] text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[#E0F2F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5B8] bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="trending">Most Funded</option>
              <option value="urgent">Most Urgent</option>
              <option value="goal">Highest Goal</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAndSortedCampaigns.length} of {campaigns.length} campaigns
          </div>
        </div>

        {/* Campaigns Grid */}
        {filteredAndSortedCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#E0F2F2]">
            <div className="w-20 h-20 bg-[#E6F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-[#00B5B8]"
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
            </div>
            <h3 className="text-2xl font-bold text-[#003d3b] mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSortBy("newest");
              }}
              className="px-6 py-2 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCampaigns.map((campaign) => {
              const progress =
                campaign.goalAmount > 0
                  ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)
                  : 0;
              return (
                  <Link
                    key={campaign._id}
                    to={`/campaign/${campaign._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E0F2F2] hover:shadow-2xl hover:-translate-y-2 hover:border-[#00B5B8] transition-all duration-300 flex flex-col h-full group"
                  >
                    <div className="relative w-full h-48 overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={resolveImg(campaign.image)}
                        alt={campaign.title}
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                        {campaign.category && (
                          <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-full">
                            {campaign.category}
                          </span>
                        )}
                        {campaign.zakatEligible && (
                          <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                            ✓ Zakat
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 flex-shrink-0 min-h-[3rem]">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow min-h-[2.5rem]">
                        {campaign.shortDescription || "No description available."}
                      </p>
                      <div className="mt-auto flex-shrink-0">
                        <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                          <div
                            className="h-2 rounded-full bg-[#00B5B8] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-[#003d3b] mb-3">
                          <span>₹{(campaign.raisedAmount || 0).toLocaleString()}</span>
                          <span>of ₹{(campaign.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-center bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold transition-all duration-300 group-hover:shadow-lg">
                          تفصیلات دیکھیں (View Details)
                        </div>
                      </div>
                    </div>
                  </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

