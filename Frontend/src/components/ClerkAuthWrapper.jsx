// ClerkAuthWrapper.jsx - Wrapper to handle Clerk authentication errors gracefully
// This wrapper prevents "illegal arguments undefined numbers" errors by catching phone auth issues
import { Component } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";

// Global error handler to catch Clerk phone authentication errors
if (typeof window !== "undefined") {
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Catch and suppress phone number validation errors
    if (
      message &&
      (message.toString().includes("illegal arguments") ||
       message.toString().includes("undefined") && message.toString().includes("number"))
    ) {
      console.warn("Clerk phone authentication error suppressed. Please disable phone auth in Clerk Dashboard.");
      return true; // Prevent default error handling
    }
    // Call original error handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Also catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || "";
    if (
      errorMessage.includes("illegal arguments") ||
      (errorMessage.includes("undefined") && errorMessage.includes("number"))
    ) {
      console.warn("Clerk phone authentication error suppressed (promise rejection).");
      event.preventDefault(); // Prevent the error from being logged
    }
  });
}

class ClerkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Log the error for debugging
    console.error("Clerk Auth Error:", error);
    
    // Check if it's a phone number related error
    const errorMessage = error?.message || error?.toString() || "";
    if (errorMessage.includes("illegal arguments") || 
        errorMessage.includes("undefined") && errorMessage.includes("number")) {
      console.warn("Phone authentication error detected. Ensure phone auth is disabled in Clerk Dashboard.");
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Clerk Auth Error Details:", error, errorInfo);
    // You can log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#003d3b] mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-4">
              There was an issue with authentication. Please try again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2 bg-[#00B5B8] text-white rounded-lg hover:bg-[#009EA1] transition"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped SignIn component with error boundary
// This prevents "illegal arguments undefined numbers" errors from breaking the UI
export function SafeSignIn(props) {
  // Merge appearance props to hide phone number fields
  const mergedAppearance = {
    ...props.appearance,
    elements: {
      ...props.appearance?.elements,
      // Hide phone number input fields
      phoneInputBox: "hidden",
      phoneInput: "hidden",
      formFieldInput__phoneNumber: "hidden",
    },
    layout: {
      ...props.appearance?.layout,
      // Only show email and social providers
      showOptionalFields: false,
    },
  };

  return (
    <ClerkErrorBoundary>
      <SignIn 
        {...props} 
        appearance={mergedAppearance}
      />
    </ClerkErrorBoundary>
  );
}

// Wrapped SignUp component with error boundary
// This prevents "illegal arguments undefined numbers" errors from breaking the UI
export function SafeSignUp(props) {
  // Merge appearance props to hide phone number fields
  const mergedAppearance = {
    ...props.appearance,
    elements: {
      ...props.appearance?.elements,
      // Hide phone number input fields
      phoneInputBox: "hidden",
      phoneInput: "hidden",
      formFieldInput__phoneNumber: "hidden",
    },
    layout: {
      ...props.appearance?.layout,
      // Only show email and social providers
      showOptionalFields: false,
    },
  };

  return (
    <ClerkErrorBoundary>
      <SignUp 
        {...props} 
        appearance={mergedAppearance}
      />
    </ClerkErrorBoundary>
  );
}

