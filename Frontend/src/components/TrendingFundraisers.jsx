import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function TrendingFundraisers() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const navigate = useNavigate();

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img.replace("http://", "https://");
    
    // Handle absolute file system paths (e.g., /opt/render/project/src/Backend/uploads/file.jpg)
    let cleanedPath = img.trim();
    
    // If it's an absolute path (starts with /), extract the relevant part
    if (cleanedPath.startsWith("/") && cleanedPath.includes("uploads")) {
      // Extract everything after "uploads/" from absolute paths
      const uploadsIndex = cleanedPath.indexOf("uploads/");
      if (uploadsIndex !== -1) {
        cleanedPath = cleanedPath.substring(uploadsIndex); // Gets "uploads/filename.jpg"
      } else {
        // If uploads is not found but path is absolute, try to extract filename
        const parts = cleanedPath.split("/");
        const filename = parts[parts.length - 1];
        if (filename && filename.includes(".")) {
          cleanedPath = `uploads/${filename}`;
        }
      }
    } else {
      // For relative paths, clean leading slashes
      cleanedPath = cleanedPath.replace(/^\/+/, "");
    }
    
    const base = import.meta.env.VITE_API_URL;
    return `${base}/${cleanedPath}`;
  };

  useEffect(() => {
    async function load() {
      try {
        // Fetch urgent campaigns (low progress) for Trending Fundraisers
        const res = await api.get("api/campaigns/featured?limit=10&sortBy=urgent");
        const arr = Array.isArray(res.data.campaigns)
          ? res.data.campaigns
          : [];
        
        // Filter to show urgent campaigns (progress < 30%) and limit to 2-3 campaigns
        const urgentCampaigns = arr
          .filter((c) => {
            const progress = c.goalAmount > 0 
              ? (c.raisedAmount / c.goalAmount) * 100 
              : 0;
            return progress < 30; // Show urgent campaigns (low progress)
          })
          .slice(0, 3); // Limit to 3 campaigns (2-3 as requested)
        
        setCampaigns(urgentCampaigns);
      } catch (e) {
        console.error("Failed to load trending:", e);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerView(3); // Desktop: 3 items
      } else if (width >= 768) {
        setItemsPerView(2); // Tablet: 2 items
      } else {
        setItemsPerView(1); // Mobile: 1 item
      }
    };
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Calculate visible campaigns based on activeIndex
  const visibleCampaigns = useMemo(() => {
    const start = activeIndex;
    const end = Math.min(start + itemsPerView, campaigns.length);
    return campaigns.slice(start, end);
  }, [campaigns, activeIndex, itemsPerView]);

  const maxIndex = Math.max(0, campaigns.length - itemsPerView);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };


  const handleContribute = (e, campaignId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/campaign/${campaignId}`);
  };

  if (!campaigns.length && !loading) {
    return (
      <section className="w-[90%] mx-auto my-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
              Trending Now
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#003D3B]">
              Trending Fundraisers
              <span className="text-gray-500 font-normal text-2xl"> (مقبول فنڈریزرس)</span>
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              View the fundraisers that are most active right now.
            </p>
          </div>
        </div>
        <div className="w-full min-h-[150px] border-2 border-dashed border-[#F9A826] rounded-xl p-10 text-center text-[#003d3b] bg-[#FFFBF0]">
          <p className="font-semibold">No fundraisers available yet.</p>
          <p className="text-gray-600 mt-1">
            ابھی تک کوئی فنڈریزرس موجود نہیں ہیں
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="w-full bg-gradient-to-b from-[#E6F8F8] to-white py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center mb-12 text-center px-4">
            <div className="max-w-3xl mx-auto">
              <p className="uppercase text-xs md:text-sm tracking-[0.5em] text-[#00B5B8] font-semibold mb-4 animate-pulse-slow">
                Trending Now
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#003D3B] mb-5 animate-slide-up leading-tight">
                Trending Fundraisers
              </h2>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 animate-fade-in-delay leading-relaxed">
                Urgent campaigns that need immediate support.
              </p>
              <div className="mt-6 animate-bounce-gentle">
                <span className="inline-block bg-gradient-to-r from-red-500 via-red-600 to-red-500 text-white text-sm md:text-base font-bold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                    URGENT NEEDED
                    <span className="inline-block w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                </span>
              </div>
            </div>
          </div>

          {loading && (
            <p className="text-center text-gray-600">Loading fundraisers...</p>
          )}

          {!loading && campaigns.length > 0 && (
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                disabled={campaigns.length <= itemsPerView}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 border-2 border-[#00B5B8] hover:scale-110 ${
                  campaigns.length > itemsPerView 
                    ? 'hover:bg-[#00B5B8] hover:text-white cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                aria-label="Previous"
              >
                <svg className="w-6 h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Cards Container */}
              <div className="flex gap-4 sm:gap-6 justify-center items-stretch px-4 sm:px-8">
                {visibleCampaigns.map((c) => {
                  const progress =
                    c.goalAmount > 0
                      ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100)
                      : 0;

                  const daysRemaining = c.endDate
                    ? Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={c._id}
                      className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm mx-auto"
                    >
                      <div className="bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col border border-gray-100 h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-[#00B5B8]" style={{ minHeight: '420px' }}>
                        {/* Image Section - Fixed height, proper display */}
                        <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                          <img
                            src={resolveImg(c.image || c.imageUrl)}
                            alt={c.title}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "/no-image.png")}
                          />
                          {/* Urgent Label */}
                          <div className="absolute top-3 right-3">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                              URGENT
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex flex-col flex-grow">
                          {/* Title */}
                          <h3 className="text-lg font-bold text-[#003d3b] mb-3 line-clamp-2 leading-tight min-h-[3rem]">
                            {c.title}
                          </h3>


                          {/* Amount Display */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center text-sm font-semibold text-[#003d3b] mb-2">
                              <span>₹{(c.raisedAmount || 0).toLocaleString('en-IN')}</span>
                              <span className="text-gray-500">
                                raised out of ₹{(c.goalAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 h-2 rounded-full">
                              <div
                                className="h-2 rounded-full transition-all duration-500 bg-[#00B5B8]"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Campaign Info */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            {daysRemaining !== null && daysRemaining > 0 ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
                              </span>
                            ) : (
                              <span></span>
                            )}
                            {c.contributors ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {c.contributors >= 1000 ? `${(c.contributors / 1000).toFixed(1)}k` : c.contributors} {c.contributors === 1 ? 'Supporter' : 'Supporters'}
                              </span>
                            ) : (
                              <span></span>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="mt-auto">
                            <button
                              onClick={(e) => handleContribute(e, c._id)}
                              className="w-full bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                            >
                              تعاون (Contribute)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                disabled={campaigns.length <= itemsPerView}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 border-2 border-[#00B5B8] hover:scale-110 ${
                  campaigns.length > itemsPerView 
                    ? 'hover:bg-[#00B5B8] hover:text-white cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                aria-label="Next"
              >
                <svg className="w-6 h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
