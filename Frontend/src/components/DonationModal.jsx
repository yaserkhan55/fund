import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonationModal({ campaignId, onClose }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDonorLoggedIn, setIsDonorLoggedIn] = useState(false);

  // Check if donor is logged in
  useEffect(() => {
    const donorToken = localStorage.getItem("donorToken");
    setIsDonorLoggedIn(!!donorToken);
  }, []);

  // Quick amount buttons
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleDonation = async () => {
    setError("");

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
        setError("Please login to donate");
        navigate("/donor/login", {
          state: { from: window.location.pathname, action: "donate", campaignId },
        });
        onClose();
        return;
      }

      // Create payment order
      const response = await axios.post(
        `${API_URL}/api/donations/create-order`,
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
        // Load Razorpay script
        await loadRazorpayScript();

        // Open Razorpay checkout
        const options = {
          key: response.data.razorpayKeyId,
          amount: response.data.order.amount,
          currency: response.data.order.currency,
          order_id: response.data.order.id,
          name: "SEUMP",
          description: `Donation to Campaign`,
          handler: async function (razorpayResponse) {
            // Verify payment
            try {
              const verifyResponse = await axios.post(
                `${API_URL}/api/donations/verify`,
                {
                  orderId: razorpayResponse.razorpay_order_id,
                  paymentId: razorpayResponse.razorpay_payment_id,
                  signature: razorpayResponse.razorpay_signature,
                  donationId: response.data.donation.id,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (verifyResponse.data.success) {
                // Success - show thank you message
                alert("Thank you! Your donation was successful. Receipt will be sent to your email.");
                onClose();
                // Reload page to update campaign stats
                window.location.reload();
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              setError("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            // Pre-fill donor details if available
          },
          theme: {
            color: "#00B5B8",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        razorpay.on("payment.failed", function (response) {
          setError("Payment failed. Please try again.");
          setLoading(false);
        });
      }
    } catch (err) {
      console.error("Donation error:", err);
      setLoading(false);
      
      if (err.response?.status === 401) {
        setError("Please login to donate");
        setTimeout(() => {
          navigate("/donor/login", {
            state: { from: window.location.pathname, action: "donate", campaignId },
          });
          onClose();
        }, 1500);
      } else if (err.response?.status === 404) {
        setError("Donation endpoint not found. Please contact support.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
      }
    }
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#003d3b]">Donate Now</h2>
            <p className="text-sm text-gray-500 mt-1">Support this campaign</p>
          </div>
          <button
            className="text-gray-400 hover:text-[#00B5B8] text-2xl font-light transition"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
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
                Login to Donate
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a donor account or login to make a donation
              </p>
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
              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      amount === amt.toString()
                        ? "bg-[#00B5B8] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ₹{amt}
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
                Donate anonymously
              </label>
            </div>

            {/* DONATE BUTTON */}
            <button
              className="group relative w-full bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white py-3.5 rounded-xl font-bold text-lg hover:from-[#009EA1] hover:to-[#008B8E] transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              onClick={handleDonation}
              disabled={loading || !amount || Number(amount) < 1}
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
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Donate Now
                  </>
                )}
              </span>
            </button>

            <p className="text-xs text-center text-gray-500">
              Secure payment powered by Razorpay
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
