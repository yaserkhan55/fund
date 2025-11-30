import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonorVerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem("donorEmail");
    const emailToUse = emailFromState || emailFromStorage;

    if (!emailToUse) {
      // No email found, redirect to register
      navigate("/donor/register");
      return;
    }

    setEmail(emailToUse);
    localStorage.setItem("donorEmail", emailToUse);

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear errors
    if (errors.otp) {
      setErrors({ ...errors, otp: "" });
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        inputRefs.current[Math.min(digits.length, 5)]?.focus();
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErrors({ otp: "Please enter complete 6-digit OTP" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/api/donors/verify-otp`, {
        email,
        otp: otpString,
      });

      if (response.data.success) {
        // Store token
        localStorage.setItem("donorToken", response.data.token);
        localStorage.setItem("donorData", JSON.stringify(response.data.donor));
        localStorage.removeItem("donorEmail");

        // Redirect to dashboard
        navigate("/donor/dashboard");
      }
    } catch (error) {
      setErrors({
        otp: error.response?.data?.message || "Invalid OTP. Please try again.",
      });
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrors({});

    try {
      await axios.post(`${API_URL}/api/donors/resend-otp`, { email });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      
      // Show success message
      setErrors({ success: "OTP resent successfully!" });
      setTimeout(() => setErrors({}), 3000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to resend OTP. Please try again.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F8F8] to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 border-[#00B5B8] overflow-hidden shadow-lg">
              <img
                src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
                className="w-full h-full object-contain p-2"
                alt="SEUMP Logo"
              />
            </div>
            <span className="text-2xl font-bold text-[#003d3b]">SEUMP</span>
          </div>
          <h1 className="text-3xl font-bold text-[#003d3b] mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E0F2F2] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-[#003d3b] mb-4 text-center">
                Enter OTP
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                      errors.otp ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="mt-3 text-sm text-red-600 text-center">{errors.otp}</p>
              )}
              {errors.success && (
                <p className="mt-3 text-sm text-green-600 text-center">{errors.success}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 text-center">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white py-3.5 rounded-xl font-bold text-lg hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">
              Didn't receive the OTP?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0 || resending}
              className="text-[#00B5B8] font-semibold hover:text-[#009EA1] transition disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resending ? (
                "Sending..."
              ) : countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                "Resend OTP"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

