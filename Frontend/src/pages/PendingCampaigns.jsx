import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

const PendingCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");

  const fetchPending = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/admin/pending-campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.campaigns)
        ? data.campaigns
        : [];
      setCampaigns(list);
    } catch (err) {
      console.error("Error loading pending:", err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    await fetch(`${API_URL}/api/admin/approve/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    fetchPending();
  };

  const reject = async (id) => {
    await fetch(`${API_URL}/api/admin/reject/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "rejected" }),
    });

    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  if (loading) return <p>Loading pending campaigns...</p>;

  return (
    <div>
      <h2>Pending Campaigns</h2>

      {campaigns.length === 0 && <p>No pending campaigns</p>}

      {campaigns.map((c) => (
        <div key={c._id} className="border p-3 rounded mb-3">
          <h3>{c.title}</h3>
          <p>{c.shortDescription}</p>

          <button onClick={() => approve(c._id)} className="mr-3 bg-green-600 text-white px-2 py-1">
            Approve
          </button>

          <button onClick={() => reject(c._id)} className="bg-red-600 text-white px-2 py-1">
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

export default PendingCampaigns;
