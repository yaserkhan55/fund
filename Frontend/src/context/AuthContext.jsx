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
  // AUTO LOGIN FOR GOOGLE USERS
  // -----------------------
  useEffect(() => {
    const activateGoogleUser = async () => {
      if (!isSignedIn || !clerkUser) return;

      const email = clerkUser.primaryEmailAddress.emailAddress;
      const name = clerkUser.fullName;

      // Call backend → backend creates your JWT
      const res = await axios.post("http://localhost:5000/api/google/google-auth", {
        email,
        name,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem("token", res.data.token);
      }
    };

    activateGoogleUser();
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
