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
    
    // Calculate max index based on items per view
    const maxIndex = Math.max(0, campaigns.length - itemsPerView);
    
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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-32 relative">
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
            {Array.from({ length: Math.max(1, campaigns.length - itemsPerView + 1) }).map((_, idx) => (
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
              transform: `translateX(-${activeIndex * (100 / itemsPerView)}%)`,
              width: `${(campaigns.length / itemsPerView) * 100}%`
            }}
          >
            {campaigns.map((c, idx) => {
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
                  className="flex-shrink-0"
                  style={{
                    width: `${100 / itemsPerView}%`,
                    paddingLeft: idx === 0 ? '0' : '0.75rem',
                    paddingRight: idx === campaigns.length - 1 ? '0' : '0.75rem'
                  }}
                >
                  <Link
                    to={`/campaign/${c._id}`}
                    className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col block border border-gray-100 relative group w-full min-h-[520px]"
                  >
                    {/* Image Section - Professional 16:9 aspect ratio */}
                    <div className="relative w-full h-[240px] overflow-hidden bg-gray-100">
                      <img
                        src={resolveImg(c.image || c.imageUrl)}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                      {/* Gradient overlay for better text readability if needed */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Category badge on image */}
                      {c.category && (
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-semibold text-white uppercase bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            {c.category}
                          </span>
                        </div>
                      )}
                      
                      {/* Zakat badge on image */}
                      {c.zakatEligible && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-semibold text-white bg-[#00897B] px-3 py-1.5 rounded-full shadow-md">
                            ✓ Zakat Eligible
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex flex-col flex-grow">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-[#1a1a1a] mb-2 line-clamp-2 leading-tight group-hover:text-[#00B5B8] transition-colors duration-200">
                        {c.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {c.shortDescription || "No description available."}
                      </p>

                      {/* Progress Section */}
                      <div className="mt-auto space-y-3">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, #F9A826 0%, #FFB84D 100%)",
                              }}
                            ></div>
                          </div>
                          
                          {/* Amount Display */}
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Raised</p>
                              <p className="text-lg font-bold text-[#1a1a1a]">₹{(c.raisedAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-medium">Goal</p>
                              <p className="text-lg font-bold text-[#1a1a1a]">₹{(c.goalAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} left
                            </span>
                          )}
                          {c.contributors && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {c.contributors >= 1000 ? `${(c.contributors / 1000).toFixed(1)}k` : c.contributors} {c.contributors === 1 ? 'contributor' : 'contributors'}
                            </span>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="w-full bg-[#00B5B8] group-hover:bg-[#009EA1] text-white py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm group-hover:shadow-md mt-3 text-center">
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
      )}
    </section>
  );
}
