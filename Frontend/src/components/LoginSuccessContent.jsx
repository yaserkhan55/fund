// LoginSuccessContent.jsx - Content component that receives Clerk data as props
import { useEffect, useContext, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function LoginSuccessContent({ isSignedIn, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLoginData } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Main auth processing function
  const handleAuth = useCallback(async () => {
    if (hasProcessed) return;
    
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
        setHasProcessed(true);
        return;
      }

      // Wait for Clerk user to be available if isSignedIn is true
      let retries = 0;
      let currentIsSignedIn = isSignedIn;
      let currentUser = user;
      
      console.log("Initial Clerk state:", { isSignedIn, hasUser: !!user, retries: 0 });
      
      // If isSignedIn is true but user is null, wait for user object
      if (currentIsSignedIn && !currentUser) {
        console.log("isSignedIn is true but user is null, waiting for user object...");
        
        // Wait up to 15 seconds for user to become available
        while (currentIsSignedIn && !currentUser && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
          
          // Re-check the latest props (they update reactively via useEffect)
          // But we need to get them from the closure, so we'll rely on useEffect re-running
          if (retries % 5 === 0) {
            console.log("Still waiting for user object...", { retries, isSignedIn, hasUser: !!user });
          }
        }
      }
      
      // Use the latest values (will be updated when useEffect re-runs)
      currentIsSignedIn = isSignedIn;
      currentUser = user;

      console.log("Final Clerk state check:", {
        isSignedIn: currentIsSignedIn,
        hasUser: !!currentUser,
        retries,
        userEmail: currentUser?.primaryEmailAddress?.emailAddress
      });

      // Check if we have Clerk user data
      if (currentIsSignedIn && currentUser) {
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
          referrer: document.referrer,
          hasUser: !!currentUser
        });

        if (isDonorFlow) {
          // Sync with donor backend
          try {
            const userEmail = currentUser.primaryEmailAddress?.emailAddress || 
                            currentUser.emailAddresses?.[0]?.emailAddress ||
                            "";
            
            const userName = currentUser.fullName || 
                             currentUser.firstName || 
                             currentUser.name ||
                             "Donor";
            
            const userImage = currentUser.imageUrl || 
                             currentUser.profileImageUrl ||
                             "";

            const response = await axios.post(`${API_URL}/api/donors/google-auth`, {
              email: userEmail,
              name: userName,
              clerkId: currentUser.id,
              imageUrl: userImage,
            });

            if (response.data.success) {
              console.log("Donor sync successful, setting token");
              
              // Set token first
              localStorage.setItem("donorToken", response.data.token);
              localStorage.setItem("donorData", JSON.stringify(response.data.donor));
              sessionStorage.removeItem("donorFlow");
              
              // Immediately dispatch event
              window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token: response.data.token } }));
              
              // Force update navbar by dispatching event multiple times with delays
              for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                  const token = localStorage.getItem("donorToken");
                  if (token) {
                    window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token } }));
                  }
                }, i * 100);
              }
              
              // Also trigger a storage event manually
              window.dispatchEvent(new StorageEvent("storage", {
                key: "donorToken",
                newValue: response.data.token
              }));
              
              // Wait a bit longer to ensure navbar has time to update
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Dispatch one more time before navigation
              window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token: response.data.token } }));
              
              // Redirect back to donation page or campaign, or home if from "Become a Donor"
              const returnUrl = location.state?.returnUrl || sessionStorage.getItem("donationReturnUrl") || "/";
              sessionStorage.removeItem("donationReturnUrl");
              
              setLoading(false);
              setHasProcessed(true);
              
              // Navigate
              navigate(returnUrl);
              
              // After navigation, dispatch multiple more times to ensure navbar updates
              setTimeout(() => {
                const token = localStorage.getItem("donorToken");
                if (token) {
                  for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token } }));
                    }, i * 100);
                  }
                }
              }, 300);
              
              setTimeout(() => {
                const token = localStorage.getItem("donorToken");
                if (token) {
                  window.dispatchEvent(new CustomEvent("donorLogin", { detail: { token } }));
                }
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
          const userEmail = currentUser.primaryEmailAddress?.emailAddress || 
                          currentUser.emailAddresses?.[0]?.emailAddress ||
                          "";
          
          const userName = currentUser.fullName || 
                         currentUser.firstName || 
                         currentUser.name ||
                         "User";
          
          const userImage = currentUser.imageUrl || 
                           currentUser.profileImageUrl ||
                           "";

          const response = await axios.post(`${API_URL}/api/auth/clerk-sync`, {
            clerkId: currentUser.id,
            email: userEmail,
            name: userName,
            imageUrl: userImage,
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
        setHasProcessed(true);
        navigate(returnUrl);
      } else {
        // No user found yet - wait a bit more if isSignedIn is true
        if (isSignedIn && !user) {
          console.log("isSignedIn is true but user is still null, will retry when user becomes available");
          // Don't redirect yet - let useEffect re-run when user becomes available
          return;
        }
        
        // Not signed in or no user after waiting
        console.log("No Clerk user found, redirecting to home", {
          isSignedIn,
          hasUser: !!user,
          retries,
          donorFlow: sessionStorage.getItem("donorFlow")
        });
        setLoading(false);
        setHasProcessed(true);
        navigate("/");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setLoading(false);
      setHasProcessed(true);
      navigate("/");
    }
  }, [navigate, location, setLoginData, isSignedIn, user, hasProcessed]);

  // Effect that triggers when user becomes available
  useEffect(() => {
    if (hasProcessed) return;
    
    // If user is available, process immediately
    if (isSignedIn && user) {
      console.log("User is available, processing auth...");
      handleAuth();
    } else if (isSignedIn && !user) {
      // isSignedIn is true but user is null - wait a bit then check again
      console.log("isSignedIn is true but user is null, waiting...");
      const timer = setTimeout(() => {
        if (isSignedIn && user && !hasProcessed) {
          console.log("User became available after wait, processing...");
          handleAuth();
        } else if (isSignedIn && !user && !hasProcessed) {
          // Still no user, try processing anyway (might work)
          console.log("Still no user after wait, trying to process...");
          handleAuth();
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!isSignedIn) {
      // Not signed in, wait a bit then redirect
      const timer = setTimeout(() => {
        if (!isSignedIn && !hasProcessed) {
          console.log("Not signed in, redirecting to home");
          setLoading(false);
          setHasProcessed(true);
          navigate("/");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, user, hasProcessed, handleAuth, navigate]);

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
