import React, { createContext, useState, useEffect, useRef } from "react";
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
  const syncedRef = useRef(false);
  
  useEffect(() => {
    // Only sync once per sign-in session
    if (!isSignedIn || !clerkUser || syncedRef.current) return;

    let isMounted = true;

    const syncClerkUser = async () => {
      if (!isMounted) return;

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

        if (isMounted && res.data?.success) {
          syncedRef.current = true; // Mark as synced
          setUser(res.data.user);
          localStorage.setItem("token", res.data.token);
        }
      } catch (err) {
        console.error("Error syncing Clerk user:", err);
      }
    };

    syncClerkUser();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]); // Only depend on isSignedIn, not clerkUser object

  // Reset sync flag when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      syncedRef.current = false;
    }
  }, [isSignedIn]);

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
