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

  // Auto-rotate carousel - move one by one through all campaigns
  useEffect(() => {
    if (!campaigns.length) return;
    
    // Calculate max index - only show complete slides (no partial slides)
    const totalSlides = Math.floor(campaigns.length / itemsPerView);
    const maxIndex = Math.max(0, totalSlides - 1);
    
    // Reset activeIndex if it's beyond maxIndex
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
    }, 4000);

    return () => clearInterval(timer);
  }, [campaigns.length, itemsPerView]);

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
      {/* Decorative light effect */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#00B5B8] to-transparent opacity-30 blur-sm"></div>
      
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
        {!loading && campaigns.length > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: Math.max(1, Math.floor(campaigns.length / itemsPerView)) }).map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to campaign ${idx + 1}`}
                className={`h-2.5 w-8 rounded-full transition-all ${
                  idx === activeIndex ? "bg-[#00B5B8]" : "bg-[#CFE7E7]"
                }`}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {loading && (
        <p className="text-center text-gray-600">Loading fundraisers...</p>
      )}

      {!loading && (
        <div className="overflow-hidden relative w-full">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ 
              transform: `translateX(-${activeIndex * 100}%)`
            }}
          >
            {/* Group campaigns into slides - only show complete slides */}
            {Array.from({ length: Math.floor(campaigns.length / itemsPerView) }).map((_, slideIdx) => (
              <div
                key={slideIdx}
                className="flex-shrink-0 w-full"
              >
                <div className="flex gap-3 sm:gap-4 w-full">
                  {campaigns
                    .slice(slideIdx * itemsPerView, slideIdx * itemsPerView + itemsPerView)
                    .map((c) => {
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
                            width: `${100 / itemsPerView}%`,
                            flexBasis: `${100 / itemsPerView}%`
                          }}
                        >
                          <Link
                            to={`/campaign/${c._id}`}
                            className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col block border border-[#E0F2F2] relative group w-full h-full"
                          >
                            {/* Image Section - Responsive height with proper aspect ratio */}
                            <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden bg-gray-200">
                              <img
                                src={resolveImg(c.image || c.imageUrl)}
                                alt={c.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => (e.currentTarget.src = "/no-image.png")}
                              />
                            </div>

                            {/* Content Section */}
                            <div className="p-5 flex flex-col flex-grow">
                              {/* Category Badge */}
                              <div className="flex items-center gap-2 mb-3">
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

                              {/* Title */}
                              <h3 className="text-lg font-bold text-[#003d3b] mb-2 line-clamp-2 leading-tight">
                                {c.title}
                              </h3>

                              {/* Description */}
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                {c.shortDescription || "No description available."}
                              </p>

                              {/* Progress Section */}
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
                                <div className="flex justify-between items-center text-sm font-semibold text-[#003d3b] mb-4">
                                  <span>₹{(c.raisedAmount || 0).toLocaleString('en-IN')}</span>
                                  <span>of ₹{(c.goalAmount || 0).toLocaleString('en-IN')}</span>
                                </div>

                                {/* Campaign Info */}
                                {(daysRemaining !== null && daysRemaining > 0) || c.contributors ? (
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                    {daysRemaining !== null && daysRemaining > 0 && (
                                      <span>Campaign ends in {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'}</span>
                                    )}
                                    {c.contributors && (
                                      <span>{c.contributors >= 1000 ? `${(c.contributors / 1000).toFixed(1)}k` : c.contributors} {c.contributors === 1 ? 'person' : 'people'} contributed</span>
                                    )}
                                  </div>
                                ) : null}

                                {/* CTA Button */}
                                <div className="w-full bg-[#00B5B8] hover:bg-[#009EA1] text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-center">
                                  Contribute Now
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
