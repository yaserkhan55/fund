import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";

export default function CategoryPage() {
  const { category } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    async function load() {
      setLoading(true);

      const minDelay = new Promise((res) => setTimeout(res, 1000)); // 1 sec

      try {
        const res = await api.get("api/campaigns/approved");

        const all = res.data.campaigns || [];

        const filtered = all.filter(
          (c) => c.category?.toLowerCase() === category.toLowerCase()
        );

        await minDelay; // show logo loader at least 1 sec

        setCampaigns(filtered);
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category]);

  // ---------------------------
  // CUSTOM WEBSITE LOGO LOADER
  // ---------------------------
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-white">
        <img
          src="/logo.png" // <-- change to your actual logo file
          alt="Loading..."
          className="w-28 opacity-90 animate-pulse"
        />
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto mt-20 mb-20">
      <h1 className="text-3xl font-bold text-[#003d3b] mb-6">
        {category} Fundraisers
      </h1>

      {!loading && campaigns.length === 0 && (
        <div className="p-10 text-center bg-[#FFFBF0] border border-[#F9A826] rounded-xl">
          <p className="text-[#003d3b] text-lg font-semibold">
            No campaigns found in this category
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <Link
            key={c._id}
            to={`/campaign/${c._id}`}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-4 border border-transparent hover:border-[#00AEEF]"
          >
            <img
              src={resolveImg(c.image || c.imageUrl)}
              alt={c.title}
              className="w-full h-48 object-cover rounded-xl"
            />

            <h3 className="text-xl font-bold text-[#003d3b] mt-3 line-clamp-2">
              {c.title}
            </h3>

            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {c.shortDescription}
            </p>

            <div className="mt-4">
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (c.raisedAmount / c.goalAmount) * 100,
                      100
                    )}%`,
                    background: "#00AEEF",
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-sm font-semibold text-[#003d3b] mt-2">
                <span>₹{(c.raisedAmount || 0).toLocaleString()}</span>
                <span>of ₹{(c.goalAmount || 0).toLocaleString()}</span>
              </div>

              <div className="mt-4 text-center bg-[#00AEEF] hover:bg-[#0099D6] text-white py-2.5 rounded-xl font-semibold transition">
                View Details • مزید معلومات
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
