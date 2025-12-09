import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonationModal({ campaignId, onClose }) {
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState(""); // WhatsApp number
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Quick amount buttons
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

    setLoading(true);

    try {
      // Use guest donation endpoint (no authentication required)
      const response = await axios.post(
        `${API_URL}/api/donations/commit-guest`,
        {
          campaignId,
          amount: Number(amount),
          message: message.trim(),
          isAnonymous: isAnonymous || false,
          donorName: isAnonymous ? "" : (donorName.trim() || ""),
          donorEmail: donorEmail.trim() || "",
          donorPhone: donorPhone.trim() || "", // WhatsApp number
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setLoading(false);
        // Store email in localStorage for checking approved donations later
        if (donorEmail) {
          localStorage.setItem("donorEmail", donorEmail);
        }
        // Don't auto-close - let user close manually after seeing the celebration
      }
    } catch (err) {
      console.error("Donation commit error:", err);
      setLoading(false);
      
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to commit donation. Please try again.");
      }
    }
  };

  return (
    <>
      {/* SUCCESS POPUP - Animated Celebration (Full Screen Overlay) */}
      {success && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-[10000] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-zoom-in">
            {/* Celebration Background */}
            <div className="relative overflow-hidden rounded-3xl">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 opacity-10"></div>

              {/* Content */}
              <div className="relative z-10 p-6 text-center">
                {/* Success Icon with Animation */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-zoom-in delay-200">
                    <svg className="w-10 h-10 text-white animate-zoom-in delay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 border-4 border-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-[#003d3b] mb-3 animate-slide-in-bottom delay-600">
                  Thank You for Your Commitment!
                </h3>

                {/* Amount Display */}
                <div className="mb-4 animate-slide-in-bottom delay-800">
                  <div className="inline-block bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white px-5 py-2 rounded-2xl shadow-lg">
                    <p className="text-xs text-white/90 mb-1">Committed Amount</p>
                    <p className="text-2xl font-bold">₹{Number(amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 mb-4 text-left animate-slide-in-bottom delay-1000">
                  <p className="text-gray-800 text-sm leading-relaxed mb-1">
                    <strong>Your payment commitment has been recorded successfully!</strong>
                  </p>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    Please note that you have <strong>not paid yet</strong>. Our admin team will contact you shortly to collect the payment. Once you make the payment to the admin personally, they will approve your donation and you will receive a confirmation.
                  </p>
                  <p className="text-gray-600 text-xs mt-2 italic">
                    We hope you will complete the donation when contacted. Thank you for your support!
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      window.location.reload();
                    }, 300);
                  }}
                  className="mt-3 px-6 py-2.5 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-bold rounded-xl hover:from-[#009EA1] hover:to-[#008B8E] transition-all transform hover:scale-105 shadow-lg animate-slide-in-bottom delay-1400 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {!success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#003d3b]">Commit Donation</h2>
                <p className="text-sm text-gray-500 mt-1">Support this campaign - No login required</p>
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

            {/* DONOR NAME (Optional) */}
            {!isAnonymous && (
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Enter your name (optional)"
                />
              </div>
            )}

            {/* DONOR EMAIL (Optional) */}
            {!isAnonymous && (
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="Enter your email for receipt (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send you a receipt if provided</p>
              </div>
            )}

            {/* DONOR PHONE - WhatsApp (Optional) - Always visible */}
            <div className="w-full">
              <label htmlFor="donorPhoneInput" className="block text-sm font-semibold text-[#003d3b] mb-2">
                WhatsApp Number (Optional) 📱
              </label>
              <input
                id="donorPhoneInput"
                type="tel"
                name="donorPhone"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ display: "block", visibility: "visible", opacity: 1 }}
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+917058733358 (with country code)"
                disabled={isAnonymous}
                autoComplete="tel"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isAnonymous 
                  ? "WhatsApp notifications not available for anonymous donations"
                  : "We'll send you a WhatsApp confirmation if provided"
                }
              </p>
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

            {/* TWO BUTTONS: Commit Payment & Pay Immediately */}
            <div className="space-y-3">
              {/* COMMIT PAYMENT BUTTON - Works Now */}
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
                      Commit Payment
                    </>
                  )}
                </span>
              </button>

              {/* PAY IMMEDIATELY BUTTON - Disabled for now */}
              <button
                className="w-full border-2 border-gray-300 text-gray-500 py-3.5 rounded-xl font-bold text-lg cursor-not-allowed opacity-50 relative"
                disabled={true}
                title="Coming soon - Payment gateway integration in progress"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pay Immediately
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Coming Soon</span>
                </span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-blue-800 text-center">
                <strong>Commit Payment:</strong> You commit to pay ₹{Number(amount) || 0} later. Admin will contact you for payment.
              </p>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
