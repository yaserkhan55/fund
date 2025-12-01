// LoginSuccess.jsx
import { useEffect, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLoginData } = useContext(AuthContext);
  const { isSignedIn, user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if it's a token-based login (legacy)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
          // Legacy token-based login
          localStorage.setItem("token", token);
          if (setLoginData) {
            setLoginData(token, null);
          }
          navigate("/");
          setLoading(false);
          return;
        }

        // Wait longer for Clerk to fully initialize
        let retries = 0;
        while (!isSignedIn && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
        }
        
        // Additional wait to ensure user object is available
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if it's Clerk authentication
        if (isSignedIn && user) {
          // Check if user wants to be a donor (from donation flow or "Become a Donor")
          const donorFlowFlag = sessionStorage.getItem("donorFlow");
          const isDonorFlow = location.state?.isDonor || 
                             donorFlowFlag === "true" ||
                             window.location.pathname.includes("/donor/") ||
                             document.referrer.includes("donation") ||
                             document.referrer.includes("donor");
          
          console.log("LoginSuccess - Donor Flow Check:", {
            isDonorFlow,
            donorFlowFlag,
            pathname: window.location.pathname,
            referrer: document.referrer
          });

          if (isDonorFlow) {
            // Sync with donor backend
            try {
              const response = await axios.post(`${API_URL}/api/donors/google-auth`, {
                email: user.primaryEmailAddress?.emailAddress,
                name: user.fullName || user.firstName || "Donor",
                clerkId: user.id,
                imageUrl: user.imageUrl,
              });

              if (response.data.success) {
                console.log("Donor sync successful, setting token");
                localStorage.setItem("donorToken", response.data.token);
                localStorage.setItem("donorData", JSON.stringify(response.data.donor));
                sessionStorage.removeItem("donorFlow");
                
                // Force update navbar by dispatching event multiple times
                for (let i = 0; i < 5; i++) {
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token: response.data.token } }));
                  }, i * 100);
                }
                
                // Also trigger a storage event manually
                window.dispatchEvent(new StorageEvent("storage", {
                  key: "donorToken",
                  newValue: response.data.token
                }));
                
                // Small delay to ensure state updates
                setTimeout(() => {
                  // Dispatch event multiple times to ensure navbar catches it
                  for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token: response.data.token } }));
                    }, i * 200);
                  }
                  
                  // Redirect back to donation page or campaign, or home if from "Become a Donor"
                  const returnUrl = location.state?.returnUrl || sessionStorage.getItem("donationReturnUrl") || "/";
                  sessionStorage.removeItem("donationReturnUrl");
                  
                  setLoading(false);
                  
                  // Navigate and then force a small refresh to ensure navbar updates
                  navigate(returnUrl);
                  
                  // After navigation, check and update navbar one more time
                  setTimeout(() => {
                    const token = localStorage.getItem("donorToken");
                    if (token) {
                      window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token } }));
                    }
                  }, 500);
                }, 1000);
                return;
              }
            } catch (error) {
              console.error("Donor sync error:", error);
              // Show error but still redirect
              alert("Failed to sync donor account. Please try logging in again.");
            }
          }

          // Regular user sync (campaign creator) - optional, don't block if it fails
          try {
            const response = await axios.post(`${API_URL}/api/auth/clerk-sync`, {
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName || "User",
              imageUrl: user.imageUrl,
            });

            if (response.data.success && response.data.token) {
              localStorage.setItem("token", response.data.token);
              if (setLoginData) {
                setLoginData(response.data.token, response.data.user);
              }
            }
          } catch (error) {
            // User sync is optional - user might just want to be a donor
            console.log("User sync skipped (user may be donor-only)");
          }

          // Redirect to home or return URL
          const returnUrl = location.state?.returnUrl || sessionStorage.getItem("donationReturnUrl") || "/";
          sessionStorage.removeItem("donationReturnUrl");
          setLoading(false);
          navigate(returnUrl);
        } else {
          // Not signed in yet, wait a bit more or redirect
          setTimeout(() => {
            if (!isSignedIn) {
              setLoading(false);
              navigate("/");
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setLoading(false);
        navigate("/");
      }
    };

    handleAuth();
  }, [navigate, isSignedIn, user, location, setLoginData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1FAFA]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00B5B8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#003d3b] font-semibold">Logging you in...</p>
        </div>
      </div>
    );
  }

  return null;
}
