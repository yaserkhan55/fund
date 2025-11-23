// src/pages/Register.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { SignUpButton } from "@clerk/clerk-react";

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ==========================
  // Normal Registration (your backend)
  // ==========================
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await register(form.name, form.email, form.password);

    if (res.ok) {
      setOkMsg("Registration successful — please login.");
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setError(res.message || "Registration failed");
    }
  };

  return (
    <div className="w-full flex justify-center py-12 bg-[#f9f5e7] min-h-[70vh]">
      <div className="w-[95%] max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-md border border-[#e0dbc8]">

        <h2 className="text-2xl md:text-3xl font-bold text-[#003d3b] mb-4 text-center">
          Create an Account
        </h2>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        {okMsg && <div className="text-sm text-green-600 mb-3">{okMsg}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <input name="name" onChange={onChange} placeholder="Full name" className="w-full p-3 border rounded-lg border-[#e0dbc8]" />
          <input name="email" onChange={onChange} placeholder="Email" className="w-full p-3 border rounded-lg border-[#e0dbc8]" />
          <input name="password" onChange={onChange} type="password" placeholder="Password" className="w-full p-3 border rounded-lg border-[#e0dbc8]" />

          <button type="submit" className="w-full bg-[#00897b] hover:bg-[#00695c] text-white py-3 rounded-lg">
            Register
          </button>
        </form>

        <div className="text-center text-gray-500 my-4">OR</div>

        {/* ⭐ CLERK SignUp: handles Google + email sign-up/magic-link */}
        <div className="flex justify-center mb-4">
          <SignUpButton mode="redirect" redirectUrl="/auth/google/success">
            <button className="w-full bg-white border border-[#00897b] text-[#00897b] py-3 rounded-lg flex items-center justify-center gap-2">
              <img src="https://developers.google.com/identity/images/g-logo.png" className="w-5 h-5" alt="Google" />
              Sign Up with Google
            </button>
          </SignUpButton>
        </div>

        <p className="text-center mt-4 text-[#003d3b]">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-[#00897b]">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
