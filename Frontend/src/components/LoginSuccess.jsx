// LoginSuccess.jsx - Wrapper that uses Clerk hooks
import { useAuth } from "@clerk/clerk-react";
import LoginSuccessContent from "./LoginSuccessContent";

export default function LoginSuccess() {
  // Use Clerk's useAuth hook properly at top level
  const { isSignedIn, user } = useAuth();
  
  return <LoginSuccessContent isSignedIn={isSignedIn} user={user} />;
}
