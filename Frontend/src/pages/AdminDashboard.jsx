import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    console.log("🔎 API_URL =", API_URL);
    console.log("🔎 TOKEN =", token);

    fetch(`${API_URL}/api/admin/pending-campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          console.error("❌ API ERROR:", msg);
          setError(`API Error: ${msg}`);
          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log("📦 DATA RECEIVED:", data);
        setPending(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("❌ FETCH FAILED:", err);
        setError(`Fetch Failed: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard (Debug Mode)</h1>

      {error && (
        <div style={{ background: "#fee", padding: 10, marginBottom: 10 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      <div style={{ background: "#eef", padding: 10, marginBottom: 10 }}>
        <strong>Debug Info</strong>
        <pre>API_URL = {API_URL}</pre>
        <pre>TOKEN = {String(token)}</pre>
        <pre>Pending = {JSON.stringify(pending, null, 2)}</pre>
      </div>

      {pending.length === 0 ? (
        <p>No pending campaigns.</p>
      ) : (
        pending.map((c) => (
          <div key={c._id} style={{ border: "1px solid #ccc", margin: 10 }}>
            <h3>{c.title}</h3>
          </div>
        ))
      )}
    </div>
  );
}
