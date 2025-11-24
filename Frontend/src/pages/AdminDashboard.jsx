import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const FALLBACK = "https://via.placeholder.com/100?text=No+Image";
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("adminToken");

  const fetchPending = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/admin/pending-campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setError("Unauthorized — please login again.");
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login";
        return;
      }

      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  // Approve campaign (backend expects PUT + status)
  const approveCampaign = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/approve/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      fetchPending();
    } catch (err) {
      console.log("Approve failed:", err);
    }
  };

  // Reject campaign (backend expects PUT + status)
  const rejectCampaign = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/reject/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      fetchPending();
    } catch (err) {
      console.log("Reject failed:", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const resolveImg = (img) => {
    if (!img) return FALLBACK;
    if (img.startsWith("http")) return img;

    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p>Loading pending campaigns...</p>
      ) : pending.length === 0 ? (
        <p>No pending campaigns right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {pending.map((item) => (
            <div key={item._id} className="p-4 border rounded-lg shadow bg-white">
              <img
                src={resolveImg(item.image || item.imageUrl)}
                alt={item.title}
                className="h-48 w-full object-cover rounded"
                onError={(e) => (e.target.src = FALLBACK)}
              />

              <h2 className="text-xl font-semibold mt-3">{item.title}</h2>
              <p className="text-gray-700">{item.shortDescription}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => approveCampaign(item._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectCampaign(item._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
