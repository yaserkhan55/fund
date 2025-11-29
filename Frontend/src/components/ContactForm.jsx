import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function ContactForm({ compact = false }) {
  const { isSignedIn, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSignedIn && user) {
      // Only auto-fill if name is empty (don't override user input)
      if (!name) {
        setName(user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || "");
      }
      // Auto-fill email if empty
      if (!email) {
        setEmail(user.emailAddresses?.[0]?.emailAddress || "");
      }
    }
  }, [isSignedIn, user]);

  const handleNameInputClick = () => {
    // Auto-fill name when input is clicked if user is logged in
    if (isSignedIn && user && !name) {
      const userName = user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || "";
      if (userName) {
        setName(userName);
      }
    }
  };

  const handleEmailInputClick = () => {
    // Auto-fill email when input is clicked if user is logged in
    if (isSignedIn && user && !email) {
      const userEmail = user.emailAddresses?.[0]?.emailAddress || "";
      if (userEmail) {
        setEmail(userEmail);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter your query");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axios.post(`${API_URL}/api/contact`, {
        name: name.trim() || "Anonymous",
        email: email.trim(),
        query: query.trim(),
      });

      setSuccess(true);
      setQuery("");
      setTimeout(() => setSuccess(false), 3000);
      // Don't clear email and name so user can see what was sent
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-white/90 backdrop-blur-md shadow-xl p-5 rounded-xl border border-[#00B5B8]/30">
        <h4 className="font-bold text-[#003D3B] mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Need Help?
        </h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onClick={handleNameInputClick}
              placeholder="Your name (click to auto-fill if logged in)"
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] text-sm cursor-text"
              required
            />
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={handleEmailInputClick}
              placeholder="Your email address (click to auto-fill if logged in) *"
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] text-sm cursor-text"
              required
            />
          </div>
          <div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Your query or question..."
              rows="3"
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] text-sm resize-none"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && (
            <p className="text-green-600 text-xs font-semibold">
              ✓ Message sent! We'll get back to you soon.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00B5B8] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#009EA1] transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-2xl p-6 md:p-8 rounded-2xl border border-[#00B5B8]/30">
      <h3 className="text-2xl font-bold text-[#003D3B] mb-2">Contact Us</h3>
      <p className="text-gray-600 mb-6">
        Have questions? We're here to help. Send us a message and we'll respond as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold text-[#003D3B] mb-2">Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={handleNameInputClick}
            placeholder="Enter your name (click to auto-fill if logged in)"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition cursor-text"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-[#003D3B] mb-2">Your Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onClick={handleEmailInputClick}
            placeholder="Enter your email address (click to auto-fill if logged in)"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition cursor-text"
            required
          />
          <p className="text-xs text-gray-500 mt-1">We'll send notifications to this email when admin replies</p>
        </div>

        <div>
          <label className="block font-semibold text-[#003D3B] mb-2">Your Query *</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tell us how we can help you..."
            rows="5"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition resize-none"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-700 text-sm font-semibold">
              ✓ Message sent successfully! We'll get back to you soon.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00B5B8] text-white py-3 rounded-xl font-bold hover:bg-[#009EA1] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            "Send Message"
          )}
        </button>
      </form>
    </div>
  );
}

