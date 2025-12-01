// LoginSuccessContent.jsx - Content component that receives Clerk data as props
import { useEffect, useContext, useState } from "react";
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

  useEffect(() => {
    // Don't process if we've already processed
    if (hasProcessed) return;
    
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

        // Wait for Clerk user to be available
        // The props might update after component mounts, so we need to wait
        let retries = 0;
        let currentIsSignedIn = isSignedIn;
        let currentUser = user;
        
        console.log("Initial Clerk state:", { isSignedIn, hasUser: !!user, retries: 0 });
        
        // Wait up to 15 seconds for Clerk to provide user data
        // Check both the initial props and wait for them to update
        while ((!currentIsSignedIn || !currentUser) && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
          
          // Always use the latest props values (they update reactively)
          currentIsSignedIn = isSignedIn;
          currentUser = user;
          
          if (currentIsSignedIn && currentUser) {
            console.log("Clerk user found after waiting:", { retries, hasUser: !!currentUser });
            break;
          }
          
          // Log progress every 5 retries
          if (retries % 5 === 0) {
            console.log("Waiting for Clerk user...", { retries, isSignedIn, hasUser: !!user });
          }
        }
        
        // Additional wait to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Final check - use latest props
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
          // No user found yet - wait a bit more if we haven't waited long enough
          if (retries < 40) {
            console.log("Waiting for Clerk user...", { retries, isSignedIn, hasUser: !!user });
            // Don't redirect yet, let the effect re-run when props update
            return;
          }
          
          // No user found - might not be signed in or Clerk not loaded
          console.log("No Clerk user found after waiting, redirecting to home", {
            retries,
            isSignedIn,
            hasUser: !!user,
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
    };

    // Add a small delay before starting to ensure page is fully loaded
    const timer = setTimeout(() => {
      handleAuth();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, location, setLoginData, isSignedIn, user, hasProcessed]);

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

