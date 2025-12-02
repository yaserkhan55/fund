import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ⚠️ CRITICAL: Import phone disabler FIRST, before Clerk
// This completely prevents Clerk from attempting phone validation
import "./utils/clerkPhoneDisabler.js";
// Then import error suppression as backup
import "./utils/clerkErrorSuppression.js";

import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

// ⚠️ REMOVED AuthProvider - Using ONLY Clerk for authentication to avoid conflicts

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      elements: {
        formButtonPrimary: "bg-gradient-to-r from-[#00B5B8] to-[#009EA1] hover:from-[#009EA1] hover:to-[#008B8E]",
        socialButtonsBlockButton: "bg-white border border-[#00897b] text-[#00897b] hover:bg-gray-50",
        rootBox: "w-full",
        card: "w-full shadow-lg",
        // Completely hide phone number fields globally using CSS
        phoneInputBox: "hidden",
        phoneInput: "hidden",
        formFieldInput__phoneNumber: "hidden",
        formFieldLabel__phoneNumber: "hidden",
        formField__phoneNumber: "hidden",
      },
      layout: {
        // Only show email and social providers, hide phone completely
        showOptionalFields: false,
      },
    }}
    // Mobile-friendly URLs
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    afterSignInUrl="/auth/google/success"
    afterSignUpUrl="/auth/google/success"
    signInFallbackRedirectUrl="/auth/google/success"
    signUpFallbackRedirectUrl="/auth/google/success"
    localization={{
      locale: "en-US",
    }}
  >
    <BrowserRouter>
      {/* Using ONLY Clerk for authentication - no conflicting AuthProvider */}
      <App />
    </BrowserRouter>
  </ClerkProvider>
);
