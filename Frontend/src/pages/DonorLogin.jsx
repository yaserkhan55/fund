import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function DonorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in (non-blocking, in background)
  // This runs in the background and doesn't prevent the login form from showing
  useEffect(() => {
    const token = localStorage.getItem("donorToken");
      
    // If no token, nothing to check - login form is already showing
    if (!token) {
      return;
    }

    // If token exists, verify it in background (don't block UI)
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/donors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 2000, // 2 second timeout
        });
        
        // If token is valid and we got donor data, redirect
        if (response?.data?.donor) {
          const redirectTo = location.state?.from || "/donor/dashboard";
          navigate(redirectTo, { replace: true });
        }
      } catch (error) {
        // Any error means token is invalid, remove it silently
        localStorage.removeItem("donorToken");
        localStorage.removeItem("donorData");
      }
    };

    // Check auth in background, don't block the UI
    checkAuth();
  }, [navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const response = await axios.post(`${API_URL}/api/donors/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data.success) {
        // Store token
        localStorage.setItem("donorToken", response.data.token);
        localStorage.setItem("donorData", JSON.stringify(response.data.donor));

        // Redirect to dashboard or previous page
        const redirectTo = location.state?.from || "/donor/dashboard";
        navigate(redirectTo);
      }
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message || "Login failed. Please check your credentials.",
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
          <h1 className="text-3xl font-bold text-[#003d3b] mb-2">Donor Login</h1>
          <p className="text-gray-600">
            Welcome back! Login to continue supporting campaigns.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E0F2F2] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#003d3b] mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition pr-12 ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00B5B8] transition"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
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
              disabled={loading}
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
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/donor/register"
                className="font-semibold text-[#00B5B8] hover:text-[#009EA1] transition"
              >
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              <Link
                to="/donor/forgot-password"
                className="text-[#00B5B8] hover:text-[#009EA1] transition"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

