import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function LoginWithPhone() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    setMsg("");

    if (!phone || phone.length !== 10) {
      setMsg("Enter valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/send-otp", { phone });

      if (res.data.success) {
        setMsg("OTP sent successfully!");
        setTimeout(() => {
          navigate(`/verify-otp?phone=${phone}`);
        }, 800);
      } else {
        setMsg(res.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setMsg("Server error. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">

        <h2 className="text-2xl font-bold text-center mb-4">
          Login with Phone
        </h2>

        {msg && (
          <p className="text-center text-sm mb-3 text-blue-600">{msg}</p>
        )}

        <label className="font-semibold">Phone Number</label>
        <input
          type="number"
          className="w-full border p-2 rounded-lg mt-1 mb-4"
          placeholder="Enter 10-digit phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button
          className="w-full bg-[#00695c] text-white py-3 rounded-lg font-semibold hover:bg-[#005248]"
          onClick={sendOtp}
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}
