import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Profile() {
  const token = localStorage.getItem("token");
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch my campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/campaigns/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
        setMyCampaigns(list);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setMyCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [token]);

  // Use imageUrl from backend (virtual field) or fallback
  const getImageUrl = (campaign) => {
    return campaign?.imageUrl || campaign?.image || "";
  };

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;

    // If image is a relative path from server
    const base = import.meta.env.VITE_API_URL;
    return `${base}/${img.replace(/^\/+/, "")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F5E7] pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-20 text-gray-600">Loading your fundraisers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5E7] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#003d3b] mb-2">My Fundraisers</h1>
          <p className="text-gray-600">Manage and track all your fundraising campaigns</p>
        </div>

        {/* Stats */}
        {Array.isArray(myCampaigns) && myCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#00B5B8]">{myCampaigns.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Fundraisers</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#00897B]">
                {myCampaigns.filter((c) => c.isApproved).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Approved</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-[#F9A826]">
                ₹{myCampaigns.reduce((sum, c) => sum + (Number(c.raisedAmount) || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Raised</div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        {!Array.isArray(myCampaigns) || myCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="text-xl font-semibold text-[#003d3b] mb-2">No Fundraisers Yet</h3>
            <p className="text-gray-600 mb-6">Start your first fundraising campaign and make a difference</p>
            <Link
              to="/create-campaign"
              className="inline-block bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Create Fundraiser
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCampaigns.map((c) => {
              // CRITICAL: Always use imageUrl from backend (virtual field) first
              let img = c?.imageUrl;
              if (!img || img === "null" || img === null) {
                img = getImageUrl(c);
              }
              if (!img || img === "null" || img === null) {
                img = "/no-image.png";
              }
              const raised = Number(c.raisedAmount || 0);
              const goal = Math.max(1, Number(c.goalAmount || 0));
              const percentage = Math.min(100, Math.round((raised / goal) * 100));
              const status = c.isApproved ? "Approved" : "Pending Approval";
              const statusColor = c.isApproved ? "bg-[#00897B] text-white" : "bg-[#F9A826] text-white";

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col min-h-[480px] hover:shadow-xl transition"
                >
                  {/* Image */}
                  <div className="h-48 w-full overflow-hidden bg-gray-200">
                    {img && img !== "/no-image.png" ? (
                      <img
                        src={resolveImg(c.image || c.imageUrl)}
                        alt={c.title}
                        onError={(e) => {
                          // If image fails to load, try fallback
                          if (e.currentTarget.src !== "/no-image.png") {
                            e.currentTarget.src = "/no-image.png";
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    {/* Status & Category */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
                        {status}
                      </span>
                      {c.category && (
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full uppercase">
                          {c.category}
                        </span>
                      )}
                    </div>

                    {/* Zakat Badge */}
                    {c.zakatEligible && (
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-[#00897B] bg-[#E6F5F3] px-3 py-1 rounded-full">
                          ✓ Zakat Eligible
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-lg text-[#003d3b] mb-2 line-clamp-2 min-h-[3rem]">
                      {c.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">{c.shortDescription || "No description provided."}</p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, background: "#00B5B8" }}
                        />
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-[#003d3b]">
                        <span>₹{raised.toLocaleString()}</span>
                        <span>of ₹{goal.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">{percentage}% funded</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        to={`/campaign/${c._id}`}
                        className="flex-1 bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold py-2.5 px-4 rounded-xl text-center transition text-sm"
                      >
                        View Details
                      </Link>
                      {!c.isApproved && (
                        <Link
                          to={`/edit-campaign/${c._id}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-center transition text-sm"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        {Array.isArray(myCampaigns) && myCampaigns.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/create-campaign"
              className="inline-block bg-[#00B5B8] hover:bg-[#009f9f] text-white font-semibold px-8 py-3 rounded-xl transition shadow-md"
            >
              + Create New Fundraiser
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}