import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import DonationModal from "./DonationModal";

export default function TrendingFundraisers() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const navigate = useNavigate();

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img.replace("http://", "https://");
    const base = import.meta.env.VITE_API_URL;
    return `${base}/${img.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("api/campaigns/approved");
        const arr = Array.isArray(res.data.campaigns)
          ? res.data.campaigns
          : [];
        setCampaigns(arr);
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

  const handleShare = (e, campaign) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/campaign/${campaign._id}`;
    const text = `I am supporting "${campaign.title}" on SEUMP. Join me: ${url}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleContribute = (e, campaignId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCampaignId(campaignId);
    setShowDonationModal(true);
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
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
                Trending Now
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#003D3B]">
                Trending Fundraisers
              </h2>
              <p className="text-gray-600 mt-2 text-sm">
                View the fundraisers that are most active right now.
              </p>
            </div>
          </div>

          {loading && (
            <p className="text-center text-gray-600">Loading fundraisers...</p>
          )}

          {!loading && campaigns.length > 0 && (
            <div className="relative">
              {/* Left Arrow */}
              {campaigns.length > itemsPerView && (
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#00B5B8] hover:text-white transition-all duration-300 border border-gray-200"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

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

                  const creatorName = c.owner?.name || "Anonymous";
                  const creatorImage = c.owner?.image || "/default-avatar.png";

                  return (
                    <div
                      key={c._id}
                      className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm mx-auto"
                    >
                      <div className="bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col border border-gray-100 h-full" style={{ minHeight: '500px' }}>
                        {/* Image Section - Fixed height, proper display */}
                        <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                          <img
                            src={resolveImg(c.image || c.imageUrl)}
                            alt={c.title}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "/no-image.png")}
                          />
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex flex-col flex-grow">
                          {/* Title */}
                          <h3 className="text-lg font-bold text-[#003d3b] mb-3 line-clamp-2 leading-tight min-h-[3.5rem]">
                            {c.title}
                          </h3>

                          {/* Creator Info */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              <img
                                src={creatorImage}
                                alt={creatorName}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                              />
                            </div>
                            <p className="text-sm text-gray-600">
                              by <span className="font-semibold text-[#003d3b]">{creatorName}</span>
                            </p>
                          </div>

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

                          {/* Action Buttons */}
                          <div className="mt-auto flex gap-2">
                            <button
                              onClick={(e) => handleShare(e, c)}
                              className="flex-1 bg-[#1877F2] text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-[#166FE5] flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              Share
                            </button>
                            <button
                              onClick={(e) => handleContribute(e, c._id)}
                              className="flex-1 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-1.5"
                            >
                              Contribute
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Arrow */}
              {campaigns.length > itemsPerView && (
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#00B5B8] hover:text-white transition-all duration-300 border border-gray-200"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Donation Modal */}
      {showDonationModal && selectedCampaignId && (
        <DonationModal
          campaignId={selectedCampaignId}
          onClose={() => {
            setShowDonationModal(false);
            setSelectedCampaignId(null);
          }}
        />
      )}
    </>
  );
}
