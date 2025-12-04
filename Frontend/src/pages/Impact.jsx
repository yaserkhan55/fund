import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Impact() {
  const [stats, setStats] = useState(null);
  const [successStories, setSuccessStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchImpactData();
  }, []);

  const fetchImpactData = async () => {
    try {
      setLoading(true);
      
      // Fetch platform statistics
      const statsRes = await axios.get(`${API_URL}/api/campaigns/stats`);
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      // Fetch success stories
      const storiesRes = await axios.get(`${API_URL}/api/campaigns/success-stories?limit=12`);
      if (storiesRes.data.success) {
        setSuccessStories(storiesRes.data.stories || []);
      }
    } catch (error) {
      console.error("Error fetching impact data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;
    
    let cleanedPath = img.trim();
    if (cleanedPath.startsWith("/") && cleanedPath.includes("uploads")) {
      const uploadsIndex = cleanedPath.indexOf("uploads/");
      if (uploadsIndex !== -1) {
        cleanedPath = cleanedPath.substring(uploadsIndex);
      }
    } else {
      cleanedPath = cleanedPath.replace(/^\/+/, "");
      if (cleanedPath && !cleanedPath.startsWith("uploads/") && !cleanedPath.startsWith("http")) {
        cleanedPath = `uploads/${cleanedPath}`;
      }
    }
    
    const baseUrl = API_URL?.replace(/\/+$/, "") || "";
    const finalPath = cleanedPath.replace(/^\/+/, "");
    return `${baseUrl}/${finalPath}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const categories = ["all", "medical", "education", "emergency"];
  const filteredStories = activeCategory === "all" 
    ? successStories 
    : successStories.filter(s => s.category?.toLowerCase() === activeCategory.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F1FAFA] to-white pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003d3b] font-semibold">Loading impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F1FAFA] to-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-[#003d3b] mb-4">
            Our Impact
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Together, we're making a real difference in people's lives. See the impact of our community.
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all">
              <div className="text-3xl md:text-4xl font-bold text-[#00B5B8] mb-2">
                {formatCurrency(stats.totalRaised || 0)}
              </div>
              <div className="text-sm md:text-base text-gray-600 font-semibold">
                Total Raised
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all">
              <div className="text-3xl md:text-4xl font-bold text-[#00B5B8] mb-2">
                {formatNumber(stats.totalCampaigns || 0)}
              </div>
              <div className="text-sm md:text-base text-gray-600 font-semibold">
                Active Campaigns
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all">
              <div className="text-3xl md:text-4xl font-bold text-[#00B5B8] mb-2">
                {formatNumber(stats.contributors || 0)}
              </div>
              <div className="text-sm md:text-base text-gray-600 font-semibold">
                Contributors
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all">
              <div className="text-3xl md:text-4xl font-bold text-[#00B5B8] mb-2">
                {formatNumber(stats.livesImpacted || 0)}
              </div>
              <div className="text-sm md:text-base text-gray-600 font-semibold">
                Lives Impacted
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-gradient-to-br from-[#00B5B8] to-[#009EA1] rounded-2xl p-6 text-white shadow-xl">
              <div className="text-2xl font-bold mb-1">{stats.successfulCampaigns || 0}</div>
              <div className="text-sm opacity-90">Successful Campaigns</div>
              {stats.totalCampaigns > 0 && (
                <div className="text-xs mt-2 opacity-75">
                  {Math.round((stats.successfulCampaigns / stats.totalCampaigns) * 100)}% Success Rate
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-[#F9A826] to-[#F57C00] rounded-2xl p-6 text-white shadow-xl">
              <div className="text-2xl font-bold mb-1">{formatCurrency(stats.avgDonation || 0)}</div>
              <div className="text-sm opacity-90">Average Donation</div>
              <div className="text-xs mt-2 opacity-75">
                {stats.totalDonations || 0} Total Donations
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-2xl p-6 text-white shadow-xl">
              <div className="text-2xl font-bold mb-1">{Math.round(stats.successRate || 0)}%</div>
              <div className="text-sm opacity-90">Success Rate</div>
              <div className="text-xs mt-2 opacity-75">
                Campaigns reaching their goals
              </div>
            </div>
          </div>
        )}

        {/* Success Stories Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#003d3b] mb-2">
                Success Stories
              </h2>
              <p className="text-gray-600">
                Campaigns that have made a real difference
              </p>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 mt-4 md:mt-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                    activeCategory === cat
                      ? "bg-[#00B5B8] text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredStories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <p className="text-gray-600 text-lg">No success stories found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => {
                const progress = story.progress || (story.goalAmount > 0 
                  ? (story.raisedAmount / story.goalAmount) * 100 
                  : 0);
                
                return (
                  <Link
                    key={story._id}
                    to={`/campaign/${story._id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-2 hover:border-[#00B5B8] transition-all duration-300 flex flex-col h-full group"
                  >
                    <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                      <img
                        src={resolveImg(story.image)}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          ✓ SUCCESS
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="text-white text-sm font-semibold">
                          {Math.round(progress)}% Funded
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {story.category && (
                          <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-full">
                            {story.category}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 min-h-[3rem]">
                        {story.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                        {story.shortDescription || "No description available."}
                      </p>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-sm font-semibold text-[#003d3b] mb-3">
                          <span>₹{(story.raisedAmount || 0).toLocaleString()}</span>
                          <span>of ₹{(story.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 h-2 rounded-full mb-3">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        <div className="text-center bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold transition-all duration-300 group-hover:shadow-lg">
                          View Story →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#00B5B8] to-[#009EA1] rounded-2xl p-12 text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">Be Part of the Impact</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of people making a difference. Start your campaign or support someone in need today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create-campaign"
                className="bg-white text-[#00B5B8] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start a Fundraiser
              </Link>
              <Link
                to="/browse"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
              >
                Browse Campaigns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

