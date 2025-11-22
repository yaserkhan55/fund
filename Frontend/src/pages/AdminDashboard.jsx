import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const FALLBACK = "https://via.placeholder.com/100?text=No+Image";
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("adminToken");

  // Fetch pending campaigns
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

  // Approve campaign FIXED ✔✔✔
  const approveCampaign = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/approve/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved: true }), // FIXED
      });

      fetchPending();
    } catch (err) {
      console.log("Approve failed:", err);
    }
  };

  // Reject/Delete campaign
  const deleteCampaign = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/reject/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPending();
    } catch (err) {
      console.log("Delete failed:", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading pending campaigns...</p>
      ) : !Array.isArray(pending) || pending.length === 0 ? (
        <p className="text-gray-700">No pending campaigns right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {(Array.isArray(pending) ? pending : []).map((item) => {
            const resolveImg = (img) => {
              if (!img) return "/no-image.png";
              if (img.startsWith("http")) return img;

              // If image is a relative path from server
              const base = import.meta.env.VITE_API_URL;
              return `${base}/${img.replace(/^\/+/, "")}`;
            };

            return (
              <div
                key={item._id}
                className="p-4 border rounded-lg shadow-md bg-white"
              >
                <div className="h-48 w-full overflow-hidden bg-gray-200 rounded mb-3">
                  <img
                    src={resolveImg(item.image || item.imageUrl)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => (e.target.src = FALLBACK)}
                  />
                </div>

                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="text-gray-700 mt-1">{item.shortDescription}</p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => approveCampaign(item._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => deleteCampaign(item._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
