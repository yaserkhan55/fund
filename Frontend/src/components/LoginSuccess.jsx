// LoginSuccess.jsx - Wrapper that uses Clerk hooks
import { useAuth, useUser } from "@clerk/clerk-react";
import LoginSuccessContent from "./LoginSuccessContent";

export default function LoginSuccess() {
  // Use Clerk's useAuth and useUser hooks properly at top level
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  
  // Wait for Clerk to be fully loaded
  const isClerkLoaded = authLoaded && userLoaded;
  
  return <LoginSuccessContent isSignedIn={isSignedIn} user={user} isClerkLoaded={isClerkLoaded} />;
}
