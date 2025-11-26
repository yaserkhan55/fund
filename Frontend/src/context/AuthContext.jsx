import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const { isSignedIn, getToken, user: clerkUser } = useAuth();

  // -----------------------
  // Normal Login (email/password)
  // -----------------------
  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        return { ok: true };
      }
      return { ok: false, message: res.data.message };

    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  // -----------------------
  // Register
  // -----------------------
  const register = async (name, email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        name,
        email,
        password,
      });

      if (res.data?.success) return { ok: true };
      return { ok: false, message: res.data.message };

    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Register failed" };
    }
  };

  // -----------------------
  // AUTO SYNC CLERK USERS TO MONGODB
  // -----------------------
  useEffect(() => {
    const syncClerkUser = async () => {
      if (!isSignedIn || !clerkUser) return;

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const name = clerkUser.fullName || clerkUser.firstName || "User";

      if (!email) return;

      try {
        // Call backend → backend syncs user to MongoDB and returns JWT
        const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";
        const clerkId = clerkUser.id; // Get Clerk user ID
        
        const res = await axios.post(`${API_URL}/api/google/google-auth`, {
          email,
          name,
          clerkId, // Pass Clerk ID to backend
        });

        if (res.data?.success) {
          setUser(res.data.user);
          localStorage.setItem("token", res.data.token);
          console.log("✅ Clerk user synced to MongoDB:", email, "Clerk ID:", clerkId);
        } else {
          console.error("Failed to sync user:", res.data);
        }
      } catch (err) {
        console.error("Error syncing Clerk user:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };

    syncClerkUser();
  }, [isSignedIn, clerkUser]);

  // -----------------------
  // Logout
  // -----------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
