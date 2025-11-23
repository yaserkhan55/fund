import React, { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // -----------------------
  // Login (email + password)
  // -----------------------
  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:3000/api/login", {
        email,
        password,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem("token", res.data.token);
        return { ok: true };
      } else {
        return { ok: false, message: res.data.message };
      }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  // -----------------------
  // Register
  // -----------------------
  const register = async (name, email, password) => {
    try {
      const res = await axios.post("http://localhost:3000/api/register", {
        name,
        email,
        password,
      });

      if (res.data?.success) {
        return { ok: true };
      } else {
        return { ok: false, message: res.data.message };
      }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Register failed" };
    }
  };

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
