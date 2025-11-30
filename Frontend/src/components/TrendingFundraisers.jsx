import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function TrendingFundraisers() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);

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

  const slides = [];
  for (let i = 0; i < campaigns.length; i += itemsPerView) {
    slides.push(campaigns.slice(i, i + itemsPerView));
  }
  const slideCount = slides.length;

  // Auto-rotate carousel - move one by one through all campaigns
  useEffect(() => {
    if (!slideCount) return;

    const maxIndex = Math.max(0, slideCount - 1);

    setActiveIndex((prev) => {
      if (prev > maxIndex) {
        return 0;
      }
      return prev;
    });
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= maxIndex) {
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, 4000); // Auto-rotate every 4 seconds

    return () => clearInterval(timer);
  }, [slideCount]);

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
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-20 mb-32 relative">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
            Trending Now
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#003D3B]">
            Trending Fundraisers
            <span className="text-gray-500 font-normal text-2xl"> (مقبول فنڈریزرس)</span>
          </h2>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Loading fundraisers...</p>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="overflow-hidden relative w-full">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ 
              transform: `translateX(-${activeIndex * 100}%)`
            }}
          >
              {/* Group campaigns into slides */}
              {slides.map((slideItems, slideIdx) => (
                <div
                  key={slideIdx}
                  className="flex-shrink-0 w-full"
                >
                  <div className="flex gap-3 sm:gap-4 w-full">
                    {slideItems.map((c) => {
                      const progress =
                        c.goalAmount > 0
                          ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100)
                          : 0;
                      
                      // Calculate days remaining if endDate exists
                      const daysRemaining = c.endDate 
                        ? Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <div
                          key={c._id}
                          className="flex-shrink-0 flex-grow-0"
                          style={{ 
                            width: `${100 / slideItems.length}%`,
                            flexBasis: `${100 / slideItems.length}%`
                          }}
                        >
                          <Link
                            to={`/campaign/${c._id}`}
                            className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col border border-[#E0F2F2] block"
                            style={{ height: '580px' }}
                          >
                            {/* Image Section - Fixed height, no hover effect */}
                            <div className="relative w-full h-[220px] overflow-hidden bg-gray-200 flex-shrink-0">
                              <img
                                src={resolveImg(c.image || c.imageUrl)}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "/no-image.png")}
                              />
                            </div>

                            {/* Content Section - Fixed height for consistency */}
                            <div className="p-5 flex flex-col flex-grow" style={{ height: '360px' }}>
                              {/* Category Badge */}
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {c.category && (
                                  <span className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 px-3 py-1 rounded-md">
                                    {c.category}
                                  </span>
                                )}
                                {c.zakatEligible && (
                                  <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-md">
                                    ✓ Zakat Eligible
                                  </span>
                                )}
                              </div>

                              {/* Title - Fixed height */}
                              <h3 className="text-lg font-bold text-[#003d3b] mb-2 line-clamp-2 leading-tight" style={{ height: '3.5rem' }}>
                                {c.title}
                              </h3>

                              {/* Description - Fixed height */}
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed" style={{ height: '2.5rem' }}>
                                {c.shortDescription || "No description available."}
                              </p>

                              {/* Progress Section - Pushed to bottom */}
                              <div className="mt-auto">
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 h-2 rounded-full mb-3">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${progress}%`,
                                      background: "#F9A826",
                                    }}
                                  ></div>
                                </div>

                                {/* Amount Display */}
                                <div className="flex justify-between items-center text-sm font-semibold text-[#003d3b] mb-3">
                                  <span>₹{(c.raisedAmount || 0).toLocaleString('en-IN')}</span>
                                  <span className="text-gray-500">of ₹{(c.goalAmount || 0).toLocaleString('en-IN')}</span>
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

                                    {/* CTA Button */}
                                    <div className="group relative w-full bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E] text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-center transform hover:scale-[1.02] overflow-hidden cursor-pointer">
                                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Donate Now
                                      </span>
                                    </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}
    </section>
  );
}
