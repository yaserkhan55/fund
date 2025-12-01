// LoginSuccessContent.jsx - Content component that receives Clerk data as props
import { useEffect, useContext, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function LoginSuccessContent({ isSignedIn, user, isClerkLoaded }) {
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

      // Use the latest values from props
      let currentIsSignedIn = isSignedIn;
      let currentUser = user;
      let retries = 0; // Declare retries at function scope
      
      console.log("Starting auth processing:", { 
        isSignedIn: currentIsSignedIn, 
        hasUser: !!currentUser,
        isClerkLoaded,
        userId: currentUser?.id 
      });
      
      // If isSignedIn is true but user is null, try to get user ID from session
      if (currentIsSignedIn && !currentUser) {
        console.log("isSignedIn is true but user is null, trying to get user from Clerk...");
        
        // Wait for user object to load (it should become available via props)
        while (currentIsSignedIn && !currentUser && retries < 30) {
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
          currentUser = user; // Re-check prop (will update when useEffect re-runs)
          
          if (currentUser) {
            console.log("✅ User object loaded after waiting:", { retries, hasUser: !!currentUser });
            break;
          }
          
          // Try to get user ID from Clerk's session as fallback
          if (retries === 10 || retries === 20) {
            try {
              const { getClerk } = await import("@clerk/clerk-react");
              const clerk = getClerk();
              
              if (clerk) {
                // Try to get userId from session
                const userId = clerk.user?.id || clerk.session?.userId;
                if (userId) {
                  console.log("Got userId from Clerk:", userId);
                  // Try to reload user
                  if (clerk.user) {
                    await clerk.user.reload();
                    currentUser = clerk.user;
                    if (currentUser) {
                      console.log("✅ User reloaded from Clerk");
                      break;
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Error getting user from Clerk:", err);
            }
          }
        }
      }
      
      // Final check - use latest prop values
      currentIsSignedIn = isSignedIn;
      if (!currentUser) {
        currentUser = user; // Use latest user prop
      }

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
            // Get user data - try multiple sources
            let userEmail = currentUser.primaryEmailAddress?.emailAddress || 
                           currentUser.emailAddresses?.[0]?.emailAddress ||
                           "";
            
            let userName = currentUser.fullName || 
                          currentUser.firstName || 
                          currentUser.name ||
                          "Donor";
            
            let userImage = currentUser.imageUrl || 
                           currentUser.profileImageUrl ||
                           "";
            
            const clerkId = currentUser.id;
            
            // If we don't have email/name but have clerkId, try to get from Clerk API
            if (clerkId && (!userEmail || !userName)) {
              try {
                const { getClerk } = await import("@clerk/clerk-react");
                const clerk = getClerk();
                if (clerk) {
                  // Try to get user from Clerk
                  const clerkUser = await clerk.user?.get();
                  if (clerkUser) {
                    userEmail = clerkUser.primaryEmailAddress?.emailAddress || 
                               clerkUser.emailAddresses?.[0]?.emailAddress ||
                               userEmail;
                    userName = clerkUser.fullName || 
                              clerkUser.firstName || 
                              userName;
                    userImage = clerkUser.imageUrl || 
                               clerkUser.profileImageUrl ||
                               userImage;
                    console.log("Got user data from Clerk API:", { userEmail, userName });
                  }
                }
              } catch (err) {
                console.error("Error fetching user from Clerk API:", err);
                // Continue with what we have
              }
            }

            // If we still don't have email, we can't proceed
            if (!userEmail && clerkId) {
              console.error("Cannot proceed: No email available for clerkId:", clerkId);
              alert("Unable to get user email from Clerk. Please try logging in again.");
              setLoading(false);
              setHasProcessed(true);
              navigate("/");
              return;
            }

            // Validate required fields before making request
            if (!userEmail || !clerkId) {
              console.error("Missing required fields for donor sync:", { userEmail, clerkId });
              alert("Unable to get required user information. Please try logging in again.");
              setLoading(false);
              setHasProcessed(true);
              navigate("/");
              return;
            }

            const response = await axios.post(`${API_URL}/api/donors/google-auth`, {
              email: userEmail,
              name: userName || "Donor",
              clerkId: clerkId,
              imageUrl: userImage || "",
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
            // More detailed error logging
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                "Failed to sync donor account";
            console.error("Donor sync error details:", {
              message: errorMessage,
              status: error.response?.status,
              data: error.response?.data,
            });
            
            // Show user-friendly error message
            const userFriendlyMessage = error.response?.data?.message || 
                                       "Failed to sync donor account. Please try logging in again.";
            alert(userFriendlyMessage);
            
            // Still redirect to home so user can try again
            setLoading(false);
            setHasProcessed(true);
            navigate("/");
            return;
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
  // This effect watches for when Clerk provides the user object
  useEffect(() => {
    if (hasProcessed) return;
    
    console.log("LoginSuccess effect triggered:", { 
      isSignedIn, 
      hasUser: !!user, 
      isClerkLoaded,
      hasProcessed 
    });
    
    // Wait for Clerk to be fully loaded first
    if (!isClerkLoaded) {
      console.log("⏳ Clerk is still loading, waiting...");
      return;
    }
    
    // If user is available, process immediately
    if (isSignedIn && user) {
      console.log("✅ User is available, processing auth immediately...");
      // Small delay to ensure user object is fully loaded
      const timer = setTimeout(() => {
        handleAuth();
      }, 300);
      return () => clearTimeout(timer);
    } else if (isSignedIn && !user) {
      // isSignedIn is true but user is null - Clerk is still loading user
      console.log("⏳ isSignedIn is true but user is null, waiting for Clerk to load user...");
      // Wait longer for Clerk to load the user object
      const timer = setTimeout(() => {
        if (isSignedIn && user && !hasProcessed) {
          console.log("✅ User became available after wait, processing...");
          handleAuth();
        } else if (isSignedIn && !user && !hasProcessed) {
          // Still no user after waiting - might be a backend issue or Clerk configuration
          console.log("⚠️ Still no user after wait, but isSignedIn is true - checking backend...");
          // Try to get user from backend or wait more
          const retryTimer = setTimeout(() => {
            if (isSignedIn && user && !hasProcessed) {
              handleAuth();
            } else {
              console.error("❌ User object never loaded. This might be a Clerk configuration issue.");
              setLoading(false);
              setHasProcessed(true);
              navigate("/");
            }
          }, 5000); // Wait 5 more seconds
          return () => clearTimeout(retryTimer);
        }
      }, 3000); // Wait 3 seconds for Clerk to load user
      return () => clearTimeout(timer);
    } else if (!isSignedIn) {
      // Not signed in, wait a bit then redirect
      console.log("❌ Not signed in, waiting before redirect...");
      const timer = setTimeout(() => {
        if (!isSignedIn && !hasProcessed) {
          console.log("Not signed in after wait, redirecting to home");
          setLoading(false);
          setHasProcessed(true);
          navigate("/");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, user, isClerkLoaded, hasProcessed, handleAuth, navigate]);

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
