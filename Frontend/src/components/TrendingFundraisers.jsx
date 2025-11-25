import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function TrendingFundraisers() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Auto-rotate carousel - move one by one through all campaigns
  useEffect(() => {
    if (!campaigns.length) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [campaigns.length]);

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
        {!loading && campaigns.length > 0 && (
          <div className="flex gap-2">
            {campaigns.map((_, idx) => (
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
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {campaigns.map((c, idx) => {
              const progress =
                c.goalAmount > 0
                  ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100)
                  : 0;

              return (
                <div
                  key={c._id}
                  className="min-w-full md:min-w-[50%] lg:min-w-[33.3333%] px-4"
                >
                  <Link
                    to={`/campaign/${c._id}`}
                    className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col h-[500px] block"
                  >
                    <div className="h-[200px] w-full overflow-hidden bg-gray-200">
                      <img
                        src={resolveImg(c.image || c.imageUrl)}
                        alt={c.title}
                        className="h-full w-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
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

                        <div className="block text-center bg-[#003d3b] hover:bg-[#022e2c] text-white py-2.5 rounded-xl font-semibold transition">
                          View Details • مزید معلومات
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
