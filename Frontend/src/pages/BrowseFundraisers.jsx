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
  const categories = ["all", "medical", "education", "emergency"];

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  const fetchAllCampaigns = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/campaigns/approved`);
      const allCampaigns = res.data.campaigns || [];
      
      // Browse Fundraisers shows all campaigns EXCEPT medical and emergency
      // Trending Fundraisers shows: Medical-related campaigns AND Emergency campaigns
      // Browse Fundraisers shows: All other campaigns (non-medical, non-emergency)
      const browseCampaigns = allCampaigns.filter((c) => {
        const category = (c.category || "").toLowerCase();
        // Exclude medical and emergency campaigns (they're in Trending)
        return category !== "medical" && category !== "emergency";
      });
      
      setCampaigns(browseCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-[#F1FAFA] via-white to-[#E6F7F7] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 animate-fadeInUp">
          <button
            onClick={() => navigate("/")}
            className="text-[#00B5B8] hover:text-white hover:bg-gradient-to-r hover:from-[#00B5B8] hover:to-[#009EA1] font-semibold mb-6 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div>
            <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold mb-3">
              Explore Campaigns
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#003d3b] mb-3">
              Browse <span className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] bg-clip-text text-transparent">Fundraisers</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl">
              Discover and support active fundraising campaigns that need your help
            </p>
          </div>
        </div>


        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 mb-10 animate-fadeInUp">
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
          <div className="mt-6 text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-[#00B5B8]">{filteredAndSortedCampaigns.length}</span> of <span className="font-bold text-[#003d3b]">{campaigns.length}</span> campaigns
          </div>
        </div>

        {/* Campaigns Grid */}
        {filteredAndSortedCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100 animate-fadeInUp">
            <div className="w-24 h-24 bg-gradient-to-br from-[#E6F7F7] to-[#00B5B8]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
              <svg
                className="w-12 h-12 text-[#00B5B8]"
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
            <h3 className="text-3xl font-bold text-[#003d3b] mb-3">No campaigns found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSortBy("newest");
              }}
              className="px-8 py-3 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-semibold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredAndSortedCampaigns.map((campaign, index) => {
              const progress =
                campaign.goalAmount > 0
                  ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)
                  : 0;
              return (
                  <Link
                    key={campaign._id}
                    to={`/campaign/${campaign._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-2 hover:border-[#00B5B8] transition-all duration-300 flex flex-col h-full group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Subtle hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00B5B8]/0 via-[#00B5B8]/0 to-[#00B5B8]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    
                    <div className="relative w-full h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                      <img
                        src={resolveImg(campaign.image)}
                        alt={campaign.title}
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Badges */}
                      {campaign.category && (
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-bold text-white uppercase bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            {campaign.category}
                          </span>
                        </div>
                      )}
                      {campaign.zakatEligible && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-bold text-white bg-gradient-to-r from-[#00897B] to-[#00695C] px-3 py-1.5 rounded-full shadow-lg">
                            ✓ Zakat
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-grow flex flex-col relative z-10">
                      <h3 className="font-bold text-lg text-[#003d3b] mb-3 line-clamp-2 flex-shrink-0 min-h-[3rem] group-hover:text-[#00B5B8] transition-colors duration-300">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-5 line-clamp-2 flex-grow min-h-[2.5rem] leading-relaxed">
                        {campaign.shortDescription || "No description available."}
                      </p>
                      <div className="mt-auto flex-shrink-0 pt-5 border-t border-gray-100">
                        <div className="mb-3">
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner mb-2">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] relative overflow-hidden"
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{Math.round(progress)}% funded</p>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-[#003d3b] mb-4">
                          <div>
                            <span className="text-lg">₹{(campaign.raisedAmount || 0).toLocaleString()}</span>
                            <span className="text-xs text-gray-500 font-normal ml-1">raised</span>
                          </div>
                          <span className="text-gray-500 font-medium">
                            of ₹{(campaign.goalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-center bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-3 rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-[1.02] shadow-md hover:shadow-lg relative overflow-hidden">
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
    </div>
  );
}

