// src/pages/Login.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendOtp as sendOtpRequest, verifyOtp as verifyOtpRequest } from "../lib/otp";

// Clerk buttons
import { SignInButton } from "@clerk/clerk-react";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const sendOtp = async () => {
    setMsg("");
    setError("");

    if (!email) return setError("Please enter your email.");

    const res = await sendOtpRequest(email);

    if (res.success) {
      setOtpSent(true);
      setMsg("OTP sent to your email!");
    } else {
      setError(res.message);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return setError("Enter the OTP sent to your email.");

    const res = await verifyOtpRequest(email, otp);

    if (res.success) {
      navigate("/dashboard");
      window.location.reload();
    } else {
      setError(res.message);
    }
  };

  const onPasswordLogin = async (e) => {
    e.preventDefault();
    setError("");

    const res = await login(email, password);

    if (res.ok) navigate("/dashboard");
    else setError(res.message);
  };

  return (
    <div className="w-full flex justify-center py-12 bg-[#f9f5e7] min-h-[70vh]">
      <div className="w-[95%] max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-md border border-[#e0dbc8]">

        <h2 className="text-2xl md:text-3xl font-bold text-[#003d3b] mb-4 text-center">
          Login
        </h2>

        {msg && <p className="text-green-600">{msg}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <input
          type="email"
          className="w-full p-3 border rounded-lg border-[#e0dbc8] mb-3"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {!otpSent && (
          <button
            type="button"
            onClick={sendOtp}
            className="w-full bg-white border border-[#00897b] text-[#00897b] py-3 rounded-lg mb-3"
          >
            Send OTP
          </button>
        )}

        {otpSent && (
          <>
            <input
              className="w-full p-3 border rounded-lg border-[#e0dbc8] mb-3"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              type="button"
              onClick={verifyOtp}
              className="w-full bg-[#00897b] text-white py-3 rounded-lg mb-3"
            >
              Verify OTP & Login
            </button>
          </>
        )}

        <div className="text-center text-gray-500 my-4">OR</div>

        {/* ⭐ CLERK: SignIn redirect (handles Google + email sign-in flows) - Mobile optimized */}
        <div className="flex justify-center mb-4">
          <SignInButton 
            mode="redirect" 
            redirectUrl="/auth/google/success"
            signInFallbackRedirectUrl="/auth/google/success"
          >
            <button
              type="button"
              className="w-full bg-white border border-[#00897b] text-[#00897b] py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" className="w-5 h-5" alt="Google" />
              Login with Google
            </button>
          </SignInButton>
        </div>

        <div className="text-center text-gray-500 my-4">OR</div>

        <form onSubmit={onPasswordLogin}>
          <input
            type="password"
            className="w-full p-3 border rounded-lg border-[#e0dbc8] mb-3"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-[#00897b] hover:bg-[#00695c] text-white py-3 rounded-lg"
          >
            Login with Password
          </button>
        </form>

        <p className="text-center mt-4 text-[#003d3b]">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-[#00897b] font-medium"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
