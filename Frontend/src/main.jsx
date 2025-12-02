import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ⚠️ CRITICAL: Import error suppression FIRST, before Clerk
// This ensures phone validation errors are caught before Clerk initializes
import "./utils/clerkErrorSuppression.js";

import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

// ⭐ Import AuthProvider
import { AuthProvider } from "./context/AuthContext.jsx";

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
        // Hide phone number fields globally
        phoneInputBox: "hidden",
        phoneInput: "hidden",
        formFieldInput__phoneNumber: "hidden",
      },
      layout: {
        // Only show email and social providers, hide phone
        showOptionalFields: false,
      },
    }}
    // Mobile-friendly URLs - enables account switching and proper redirects
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    afterSignInUrl="/"
    afterSignUpUrl="/"
    // Disable phone number authentication globally to prevent errors
    localization={{
      locale: "en-US",
    }}
  >
    <BrowserRouter>
      {/* ⭐ wrap your entire app so SignINButton & SignUpButton work */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ClerkProvider>
);
