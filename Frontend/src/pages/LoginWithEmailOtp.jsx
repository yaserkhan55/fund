import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../lib/otp";

export default function LoginWithEmailOtp() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    console.log("SEND OTP BUTTON CLICKED");
    setMsg("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    const response = await sendOtp(email);

    if (response?.success) {
      setMsg("OTP sent! Please check your email.");
      navigate("/verify-otp", { state: { email } });
    } else {
      setError(response?.message || "Failed to send OTP.");
    }
  };

  return (
    <div className="w-full flex justify-center py-12 bg-[#f9f5e7] min-h-[70vh]">
      <div className="w-[95%] max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Login with Email OTP</h2>

        {msg && <p className="text-green-600 mb-2">{msg}</p>}
        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          type="email"
          className="w-full border p-3 rounded-lg my-3"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="button"
          onClick={handleSendOtp}
          className="w-full bg-[#00897b] hover:bg-[#00695c] text-white py-3 rounded-lg"
        >
          Send OTP
        </button>
      </div>
    </div>
  );
}
