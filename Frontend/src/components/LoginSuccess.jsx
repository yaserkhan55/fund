// LoginSuccess.jsx
import { useEffect, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLoginData } = useContext(AuthContext);
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

        // Wait for Clerk to initialize - check window.__clerk
        let retries = 0;
        let clerkUser = null;
        let clerkLoaded = false;

        // Wait up to 15 seconds for Clerk to load
        while (!clerkLoaded && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;

          // Check if Clerk is loaded via window object
          if (window.__clerk) {
            const clerk = window.__clerk;
            
            // Check if Clerk is loaded
            if (clerk.loaded || clerk.client) {
              clerkLoaded = true;
              
              // Try multiple ways to get user
              if (clerk.user) {
                clerkUser = clerk.user;
                break;
              }
              
              if (clerk.session?.user) {
                clerkUser = clerk.session.user;
                break;
              }
              
              // Try to get from client
              if (clerk.client?.sessions?.[0]?.user) {
                clerkUser = clerk.client.sessions[0].user;
                break;
              }
            }
          }

          // Alternative: Try to access Clerk via dynamic import
          try {
            const clerkModule = await import("@clerk/clerk-react");
            if (clerkModule) {
              // Try to use useAuth hook via a workaround
              // But we can't call hooks here, so check window.__clerk again
              if (window.__clerk) {
                const clerk = window.__clerk;
                if (clerk.loaded || clerk.client) {
                  clerkLoaded = true;
                  if (clerk.user) {
                    clerkUser = clerk.user;
                    break;
                  }
                  if (clerk.session?.user) {
                    clerkUser = clerk.session.user;
                    break;
                  }
                }
              }
            }
          } catch (err) {
            // Continue waiting
          }
        }

        // If we still don't have user, try one more time with a fresh check
        if (!clerkUser && window.__clerk) {
          const clerk = window.__clerk;
          if (clerk.loaded || clerk.client) {
            if (clerk.user) {
              clerkUser = clerk.user;
            } else if (clerk.session?.user) {
              clerkUser = clerk.session.user;
            } else if (clerk.client?.sessions?.[0]?.user) {
              clerkUser = clerk.client.sessions[0].user;
            }
          }
        }
        
        console.log("Clerk user detection:", {
          hasClerk: !!window.__clerk,
          clerkLoaded: window.__clerk?.loaded,
          hasUser: !!clerkUser,
          retries
        });

        // Additional wait to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have Clerk user data
        if (clerkUser) {
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
            hasUser: !!clerkUser
          });

          if (isDonorFlow) {
            // Sync with donor backend
            try {
              const userEmail = clerkUser.primaryEmailAddress?.emailAddress || 
                              clerkUser.emailAddresses?.[0]?.emailAddress ||
                              clerkUser.emailAddresses?.[0]?.emailAddress ||
                              "";
              
              const userName = clerkUser.fullName || 
                               clerkUser.firstName || 
                               clerkUser.name ||
                               "Donor";
              
              const userImage = clerkUser.imageUrl || 
                               clerkUser.profileImageUrl ||
                               "";

              const response = await axios.post(`${API_URL}/api/donors/google-auth`, {
                email: userEmail,
                name: userName,
                clerkId: clerkUser.id,
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
            const userEmail = clerkUser.primaryEmailAddress?.emailAddress || 
                            clerkUser.emailAddresses?.[0]?.emailAddress ||
                            "";
            
            const userName = clerkUser.fullName || 
                           clerkUser.firstName || 
                           clerkUser.name ||
                           "User";
            
            const userImage = clerkUser.imageUrl || 
                             clerkUser.profileImageUrl ||
                             "";

            const response = await axios.post(`${API_URL}/api/auth/clerk-sync`, {
              clerkId: clerkUser.id,
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
          navigate(returnUrl);
        } else {
          // No user found - might not be signed in or Clerk not loaded
          console.log("No Clerk user found, redirecting to home");
          setLoading(false);
          navigate("/");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setLoading(false);
        navigate("/");
      }
    };

    // Add a delay before starting to ensure page is fully loaded
    const timer = setTimeout(() => {
      handleAuth();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [navigate, location, setLoginData]);

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
