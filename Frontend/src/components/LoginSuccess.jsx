// LoginSuccess.jsx
import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const { setLoginData } = useContext(AuthContext);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Decode token to get user info (or fetch from backend)
      try {
        // Store token and redirect to home
        localStorage.setItem("token", token);
        // You may want to fetch user data here or decode from token
        setLoginData(token, null); // User data will be fetched if needed
        navigate("/");
      } catch (err) {
        console.error("Login error:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate, setLoginData]);

  return <p>Logging you in…</p>;
}
