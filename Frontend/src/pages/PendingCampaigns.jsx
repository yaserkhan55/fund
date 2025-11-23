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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // backend returns array
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading pending:", err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    await fetch(`${API_URL}/api/admin/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchPending();
  };

  const reject = async (id) => {
    await fetch(`${API_URL}/api/admin/reject/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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

      {(!Array.isArray(campaigns) || campaigns.length === 0) && (
        <p>No pending campaigns</p>
      )}

      {(Array.isArray(campaigns) ? campaigns : []).map((c) => (
        <div
          key={c._id}
          style={{
            border: "1px solid #ccc",
            margin: 10,
            padding: 10,
            borderRadius: 8,
          }}
        >
          <h3>{c.title}</h3>
          <p>{c.shortDescription}</p>

          <button
            onClick={() => approve(c._id)}
            style={{ marginRight: 10, background: "green", color: "white" }}
          >
            Approve
          </button>
          <button
            onClick={() => reject(c._id)}
            style={{ background: "red", color: "white" }}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

export default PendingCampaigns;
