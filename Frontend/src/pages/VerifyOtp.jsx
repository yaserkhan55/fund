import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../lib/otp";

export default function VerifyEmailOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(AuthContext);

  const [email] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerifyOtp = async () => {
    setError("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    const response = await verifyOtp(email, otp);

    if (response?.success) {
      setUser(response.user);
      setToken(response.token);
      navigate("/");
    } else {
      setError(response?.message || "Invalid OTP. Please try again.");
    }
  };


  return (
    <div className="w-full flex justify-center py-12 bg-[#f9f5e7] min-h-[70vh]">
      <div className="w-[95%] max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Verify Email OTP</h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          className="w-full border p-3 rounded-lg my-3 bg-gray-100"
          value={email}
          readOnly
        />

        <input
          className="w-full border p-3 rounded-lg my-3"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          type="button"
          onClick={handleVerifyOtp}
          className="w-full bg-[#00897b] hover:bg-[#00695c] text-white py-3 rounded-lg"
        >
          Verify & Login
        </button>
      </div>
    </div>
  );
}
