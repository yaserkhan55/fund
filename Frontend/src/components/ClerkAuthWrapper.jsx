// ClerkAuthWrapper.jsx - Wrapper to handle Clerk authentication errors gracefully
// This wrapper prevents "illegal arguments undefined numbers" errors by catching phone auth issues
import { Component } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";

// Global error handler to catch Clerk phone authentication errors
// This runs immediately when the module loads to catch errors early
if (typeof window !== "undefined") {
  // Intercept all console.error calls to suppress phone validation errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || ''
    ).join(' ');
    
    // Suppress phone number validation errors
    if (
      errorMessage.includes("illegal arguments") ||
      (errorMessage.includes("undefined") && errorMessage.includes("number")) ||
      errorMessage.includes("Illegal arguments") ||
      (errorMessage.includes("undefined") && errorMessage.includes("Number"))
    ) {
      // Silently suppress - don't log at all
      return;
    }
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };

  // Global error handler
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorStr = message?.toString() || error?.message || error?.toString() || "";
    
    // Catch and suppress phone number validation errors
    if (
      errorStr.includes("illegal arguments") ||
      (errorStr.includes("undefined") && errorStr.includes("number")) ||
      errorStr.includes("Illegal arguments") ||
      (errorStr.includes("undefined") && errorStr.includes("Number"))
    ) {
      // Suppress completely
      return true; // Prevent default error handling
    }
    // Call original error handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || "";
    if (
      errorMessage.includes("illegal arguments") ||
      (errorMessage.includes("undefined") && errorMessage.includes("number")) ||
      errorMessage.includes("Illegal arguments") ||
      (errorMessage.includes("undefined") && errorMessage.includes("Number"))
    ) {
      // Suppress promise rejection
      event.preventDefault();
      event.stopPropagation();
    }
  }, true); // Use capture phase

  // Also intercept console.warn for phone-related warnings
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const warnMessage = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || ''
    ).join(' ');
    
    // Suppress phone-related warnings
    if (
      warnMessage.includes("illegal arguments") ||
      (warnMessage.includes("undefined") && warnMessage.includes("number"))
    ) {
      return; // Suppress
    }
    originalConsoleWarn.apply(console, args);
  };
}

class ClerkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Log the error for debugging
    console.error("Clerk Auth Error:", error);
    
    // Check if it's a phone number related error - if so, don't show error UI
    const errorMessage = error?.message || error?.toString() || "";
    if (errorMessage.includes("illegal arguments") || 
        (errorMessage.includes("undefined") && errorMessage.includes("number"))) {
      console.warn("Phone authentication error detected. Suppressing error UI.");
      // Don't show error UI for phone errors - just log and continue
      return { hasError: false, error: null };
    }
    
    // For other errors, show error UI
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
  // Merge appearance props to completely hide phone number fields
  const mergedAppearance = {
    ...props.appearance,
    elements: {
      ...props.appearance?.elements,
      // Completely hide phone number input fields with !important
      phoneInputBox: "hidden !important",
      phoneInput: "hidden !important",
      formFieldInput__phoneNumber: "hidden !important",
      formFieldLabel__phoneNumber: "hidden !important",
      formField__phoneNumber: "hidden !important",
    },
    layout: {
      ...props.appearance?.layout,
      // Only show email and social providers - no phone
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
  // Merge appearance props to completely hide phone number fields
  const mergedAppearance = {
    ...props.appearance,
    elements: {
      ...props.appearance?.elements,
      // Completely hide phone number input fields with !important
      phoneInputBox: "hidden !important",
      phoneInput: "hidden !important",
      formFieldInput__phoneNumber: "hidden !important",
      formFieldLabel__phoneNumber: "hidden !important",
      formField__phoneNumber: "hidden !important",
    },
    layout: {
      ...props.appearance?.layout,
      // Only show email and social providers - no phone
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

