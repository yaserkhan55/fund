import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

const PendingCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);

  const fetchPending = async () => {
    const res = await fetch(`${API_URL}/api/campaigns`, {
      credentials: "include"
    });
    const data = await res.json();

    const list = Array.isArray(data?.campaigns) ? data.campaigns : [];
    const pending = list.filter(c => c.isApproved === false);
    setCampaigns(pending);
  };

  const approve = async (id) => {
    await fetch(`${API_URL}/api/campaigns/approve/${id}`, {
      method: "PUT",
      credentials: "include"
    });
    fetchPending();
  };

  const reject = async (id) => {
    await fetch(`${API_URL}/api/campaigns/reject/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div>
      <h2>Pending Campaigns</h2>

      {!Array.isArray(campaigns) || campaigns.length === 0 && <p>No pending campaigns</p>}

      {(Array.isArray(campaigns) ? campaigns : []).map((c) => (
        <div key={c._id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{c.title}</h3>
          <p>{c.shortDescription}</p>

          <button onClick={() => approve(c._id)}>Approve</button>
          <button onClick={() => reject(c._id)}>Reject</button>
        </div>
      ))}
    </div>
  );
};

export default PendingCampaigns;
