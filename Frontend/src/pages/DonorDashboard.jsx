import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonorDashboard() {
  const navigate = useNavigate();
  const [donorData, setDonorData] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDonations: 0,
    pendingDonations: 0,
    verifiedDonations: 0,
  });

  useEffect(() => {
    const donorToken = localStorage.getItem("donorToken");
    if (!donorToken) {
      navigate("/donor/login");
      return;
    }

    fetchDonorData();
    fetchDonations();
  }, [navigate]);

  const fetchDonorData = async () => {
    try {
      const token = localStorage.getItem("donorToken");
      const response = await axios.get(`${API_URL}/api/donors/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDonorData(response.data.donor);
        setStats({
          totalDonated: response.data.donor.totalDonated || 0,
          totalDonations: response.data.donor.totalDonations || 0,
          pendingDonations: 0,
          verifiedDonations: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching donor data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("donorToken");
        navigate("/donor/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("donorToken");
      const response = await axios.get(`${API_URL}/api/donations/my-donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDonations(response.data.donations || []);
        
        // Calculate stats
        const pending = response.data.donations.filter(d => d.paymentStatus === "pending").length;
        const verified = response.data.donations.filter(d => d.paymentStatus === "success").length;
        
        setStats(prev => ({
          ...prev,
          pendingDonations: pending,
          verifiedDonations: verified,
        }));
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("donorToken");
    localStorage.removeItem("donorData");
    navigate("/");
  };

  const resolveImg = (img) => {
    if (!img) return "/no-image.png";
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#003d3b] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1FAFA] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#003d3b] mb-2">
                Donor Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back, {donorData?.name || "Donor"}! Manage your donations here.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <p className="text-sm text-gray-500 mb-2">Total Donated</p>
            <p className="text-3xl font-bold text-[#00B5B8]">
              ₹{stats.totalDonated.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <p className="text-sm text-gray-500 mb-2">Total Donations</p>
            <p className="text-3xl font-bold text-[#003d3b]">
              {stats.totalDonations}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <p className="text-sm text-gray-500 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingDonations}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E0F2F2]">
            <p className="text-sm text-gray-500 mb-2">Verified</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.verifiedDonations}
            </p>
          </div>
        </div>

        {/* Donations List */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E0F2F2] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#003d3b]">My Donations</h2>
            <Link
              to="/browse"
              className="px-4 py-2 bg-[#00B5B8] text-white rounded-xl font-semibold hover:bg-[#009EA1] transition"
            >
              Browse Campaigns
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#E6F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-[#00B5B8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#003d3b] mb-2">No donations yet</h3>
              <p className="text-gray-600 mb-6">
                Start supporting campaigns by making your first donation
              </p>
              <Link
                to="/browse"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-semibold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition"
              >
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <Link
                  key={donation._id}
                  to={`/campaign/${donation.campaignId?._id || donation.campaignId}`}
                  className="block border border-[#E0F2F2] rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    {donation.campaignId?.imageUrl && (
                      <img
                        src={resolveImg(donation.campaignId.imageUrl)}
                        alt={donation.campaignId.title}
                        className="w-20 h-20 rounded-xl object-cover"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#003d3b] mb-1">
                        {donation.campaignId?.title || "Campaign"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Amount: ₹{donation.amount.toLocaleString('en-IN')}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            donation.paymentStatus === "success"
                              ? "bg-green-100 text-green-700"
                              : donation.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {donation.paymentStatus}
                        </span>
                        <span>
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

