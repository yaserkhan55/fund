import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;

    // If image is a relative path from server
    const base = import.meta.env.VITE_API_URL;
    return `${base}/${img.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    async function fetchApproved() {
      const res = await api.get("/api/campaigns/approved");
      setCampaigns(res.data.data);
    }
    fetchApproved();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {campaigns.map((c) => (
        <Link
          key={c._id}
          to={`/campaign/${c._id}`}
          className="shadow-lg rounded-xl bg-white p-3 hover:scale-105 transition"
        >
          <img
            src={resolveImg(c.image || c.imageUrl)}
            onError={(e) => (e.currentTarget.src = "/no-image.png")}
            className="w-full h-56 object-cover rounded-lg"
          />

          <h3 className="font-semibold text-lg mt-3">{c.title}</h3>

          <p className="text-gray-600 text-sm">
            {c.shortDescription
              ? c.shortDescription.substring(0, 70)
              : "No description available"}
            ...
          </p>

          <p className="mt-2 font-bold">Goal: ₹{c.goalAmount}</p>
        </Link>
      ))}
    </div>
  );
}
