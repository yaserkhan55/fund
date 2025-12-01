import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { SignUpButton, useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonorRegister() {
  const navigate = useNavigate();
  const { isSignedIn, user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google authentication via Clerk
  useEffect(() => {
    if (isSignedIn && user) {
      // User signed up via Google, create donor account
      const createDonorWithGoogle = async () => {
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
            // Redirect to OTP verification or dashboard
            navigate("/donor/verify-otp", {
              state: { email: user.primaryEmailAddress?.emailAddress },
            });
          }
        } catch (error) {
          console.error("Google auth error:", error);
          setErrors({
            submit: error.response?.data?.message || "Failed to create account with Google. Please try again.",
          });
        } finally {
          setGoogleLoading(false);
        }
      };

      createDonorWithGoogle();
    }
  }, [isSignedIn, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/api/donors/register`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess(true);
        setRegisteredEmail(formData.email.trim().toLowerCase());
        // Store token
        if (response.data.token) {
          localStorage.setItem("donorToken", response.data.token);
        }
        // Redirect to OTP verification after 2 seconds
        setTimeout(() => {
          navigate("/donor/verify-otp", {
            state: { email: formData.email.trim().toLowerCase() },
          });
        }, 2000);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F8F8] to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 border-[#00B5B8] overflow-hidden shadow-lg">
                <img
                  src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
                  className="w-full h-full object-contain p-2"
                  alt="SEUMP Logo"
                />
              </div>
              <span className="text-2xl font-bold text-[#003d3b]">SEUMP</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-[#003d3b] mb-2">Create Donor Account</h1>
          <p className="text-gray-600">
            Join us in making a difference. Register to start donating to campaigns.
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E0F2F2] p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#003d3b] mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-4">
                We've sent an OTP to <strong>{registeredEmail}</strong>
              </p>
              <p className="text-sm text-gray-500">Redirecting to verification...</p>
            </div>
          ) : (
            <>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                    errors.name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                    errors.email ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your 10-digit phone number"
                  maxLength={10}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                    errors.phone ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 6 characters)"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                    errors.confirmPassword ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
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
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <div className="mb-6">
              <SignUpButton mode="redirect" redirectUrl={window.location.origin + "/donor/register"}>
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  {googleLoading ? (
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
                  ) : (
                    <>
                      <img
                        src="https://developers.google.com/identity/images/g-logo.png"
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span>Sign up with Google</span>
                    </>
                  )}
                </button>
              </SignUpButton>
            </div>
            </>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/donor/login"
                className="font-semibold text-[#00B5B8] hover:text-[#009EA1] transition"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

