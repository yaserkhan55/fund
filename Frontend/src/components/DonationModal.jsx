import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonationModal({ campaignId, onClose }) {
  const navigate = useNavigate();
  const { isSignedIn, user } = useAuth();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDonorLoggedIn, setIsDonorLoggedIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check if donor is logged in (either via token or Google)
  useEffect(() => {
    const donorToken = localStorage.getItem("donorToken");
    setIsDonorLoggedIn(!!donorToken || isSignedIn);
  }, [isSignedIn]);

  // Handle Google authentication sync
  useEffect(() => {
    if (isSignedIn && user && !localStorage.getItem("donorToken")) {
      const syncDonorWithGoogle = async () => {
        try {
          setGoogleLoading(true);
          const response = await axios.post(`${API_URL}/api/donors/google-auth`, {
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.firstName || "Donor",
            clerkId: user.id,
            imageUrl: user.imageUrl,
          });

          if (response.data.success) {
            localStorage.setItem("donorToken", response.data.token);
            localStorage.setItem("donorData", JSON.stringify(response.data.donor));
            
            // Dispatch event to notify navbar
            window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token: response.data.token } }));
            
            setIsDonorLoggedIn(true);
          }
        } catch (error) {
          console.error("Google auth sync error:", error);
          setError("Failed to sync Google account. Please try again.");
        } finally {
          setGoogleLoading(false);
        }
      };

      syncDonorWithGoogle();
    }
  }, [isSignedIn, user]);

  // Quick amount buttons - More realistic amounts
  const quickAmounts = [
    { label: "₹100", value: 100 },
    { label: "₹500", value: 500 },
    { label: "₹1,000", value: 1000 },
    { label: "₹2,500", value: 2500 },
    { label: "₹5,000", value: 5000 },
    { label: "₹10,000", value: 10000 },
    { label: "Other", value: "other" },
  ];

  const handleAmountClick = (value) => {
    if (value === "other") {
      setAmount("");
      // Focus on input
      setTimeout(() => {
        const input = document.querySelector('input[type="number"]');
        if (input) input.focus();
      }, 100);
    } else {
      setAmount(value.toString());
    }
  };

  const handleDonation = async () => {
    setError("");
    setSuccess(false);

    if (!amount || Number(amount) < 1) {
      setError("Please enter a valid donation amount (minimum ₹1).");
      return;
    }

    // Check if donor is logged in
    if (!isDonorLoggedIn) {
      // Redirect to donor login with return path
      navigate("/donor/login", {
        state: { from: window.location.pathname, action: "donate", campaignId },
      });
      onClose();
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("donorToken");
      if (!token) {
        setError("Please login to commit donation");
        navigate("/donor/login", {
          state: { from: window.location.pathname, action: "donate", campaignId },
        });
        onClose();
        return;
      }

      // Create donation commitment (without payment)
      const response = await axios.post(
        `${API_URL}/api/donations/commit`,
        {
          campaignId,
          amount: Number(amount),
          message: message.trim(),
          isAnonymous,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        // Show success message for 3 seconds then close
        setTimeout(() => {
          onClose();
          // Reload page to update campaign stats
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      console.error("Donation commit error:", err);
      setLoading(false);
      
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Network error. Please check your connection and try again.");
      } else if (err.response?.status === 401) {
        setError("Please login to commit donation");
        setTimeout(() => {
          navigate("/donor/login", {
            state: { from: window.location.pathname, action: "donate", campaignId },
          });
          onClose();
        }, 1500);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to commit donation. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#003d3b]">Commit Donation</h2>
            <p className="text-sm text-gray-500 mt-1">Pledge your support to this campaign</p>
          </div>
          <button
            className="text-gray-400 hover:text-[#00B5B8] text-2xl font-light transition"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
            <p className="text-sm text-green-700">
              Your donation commitment of ₹{Number(amount).toLocaleString('en-IN')} has been recorded.
            </p>
            <p className="text-xs text-green-600 mt-2">You will be contacted for payment processing.</p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && !success && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isDonorLoggedIn ? (
          /* NOT LOGGED IN - Show login prompt */
          <div className="space-y-4">
            <div className="bg-[#E6F8F8] border border-[#00B5B8]/30 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00B5B8] to-[#009EA1] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#003d3b] mb-2">
                Login to Commit Donation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a donor account or login to commit your donation
              </p>
              
              {/* Google Authentication - Link to full Clerk pages */}
              <div className="mb-4">
                <Link
                  to="/donor/sign-up"
                  onClick={(e) => {
                    console.log("Navigating to /donor/sign-up from modal");
                    sessionStorage.setItem("donorFlow", "true");
                    sessionStorage.setItem("donationReturnUrl", window.location.pathname);
                    onClose();
                  }}
                  className="block w-full bg-white border border-[#00897b] text-[#00897b] py-3 rounded-lg text-center font-semibold mb-2 hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
                  <span>Sign up with Google</span>
                </Link>
                <Link
                  to="/donor/sign-in"
                  onClick={(e) => {
                    console.log("Navigating to /donor/sign-in from modal");
                    sessionStorage.setItem("donorFlow", "true");
                    sessionStorage.setItem("donationReturnUrl", window.location.pathname);
                    onClose();
                  }}
                  className="block w-full bg-white border border-[#00897b] text-[#00897b] py-3 rounded-lg text-center font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
                  <span>Login with Google</span>
                </Link>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#E6F8F8] text-gray-500">OR</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigate("/donor/register");
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white py-2.5 rounded-xl font-semibold hover:from-[#009EA1] hover:to-[#008B8E] transition"
                >
                  Register
                </button>
                <button
                  onClick={() => {
                    navigate("/donor/login", {
                      state: { from: window.location.pathname, action: "donate", campaignId },
                    });
                    onClose();
                  }}
                  className="flex-1 border-2 border-[#00B5B8] text-[#00B5B8] py-2.5 rounded-xl font-semibold hover:bg-[#E6F7F7] transition"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* LOGGED IN - Show donation form */
          <div className="space-y-5">
            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-sm font-semibold text-[#003d3b] mb-3">
                Donation Amount (₹) *
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition text-lg font-semibold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
              {/* Quick Amount Buttons - More functional */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {quickAmounts.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleAmountClick(item.value)}
                    className={`px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      amount === item.value.toString()
                        ? "bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white shadow-lg scale-105"
                        : item.value === "other"
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-dashed border-gray-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGE (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                Message (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition resize-none"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a message of support..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
            </div>

            {/* ANONYMOUS CHECKBOX */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-[#00B5B8] border-gray-300 rounded focus:ring-[#00B5B8]"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                Commit donation anonymously
              </label>
            </div>

            {/* COMMIT BUTTON */}
            <button
              className="group relative w-full bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white py-3.5 rounded-xl font-bold text-lg hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              onClick={handleDonation}
              disabled={loading || !amount || Number(amount) < 1 || success}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#009EA1] to-[#00B5B8] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
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
                    Committing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Commit Donation
                  </>
                )}
              </span>
            </button>

            <p className="text-xs text-center text-gray-500">
              Your commitment will be recorded. You will be contacted for payment processing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
