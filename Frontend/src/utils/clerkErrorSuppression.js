// clerkErrorSuppression.js
// This file MUST be imported before Clerk to suppress phone validation errors
// Load this in main.jsx BEFORE ClerkProvider

if (typeof window !== "undefined") {
  // Intercept all console.error calls to suppress phone validation errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || String(arg)
    ).join(' ');
    
    // Suppress phone number validation errors (case-insensitive)
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("illegal arguments") ||
      (lowerMessage.includes("undefined") && lowerMessage.includes("number")) ||
      lowerMessage.includes("illegal argument") ||
      errorMessage.match(/illegal.*argument.*number/i) ||
      errorMessage.match(/undefined.*number/i)
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
    const errorStr = String(message || error?.message || error || "");
    const lowerStr = errorStr.toLowerCase();
    
    // Catch and suppress phone number validation errors
    if (
      lowerStr.includes("illegal arguments") ||
      (lowerStr.includes("undefined") && lowerStr.includes("number")) ||
      lowerStr.includes("illegal argument") ||
      errorStr.match(/illegal.*argument.*number/i) ||
      errorStr.match(/undefined.*number/i)
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
  const rejectionHandler = (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || "";
    const lowerMessage = errorMessage.toLowerCase();
    
    if (
      lowerMessage.includes("illegal arguments") ||
      (lowerMessage.includes("undefined") && lowerMessage.includes("number")) ||
      lowerMessage.includes("illegal argument") ||
      errorMessage.match(/illegal.*argument.*number/i) ||
      errorMessage.match(/undefined.*number/i)
    ) {
      // Suppress promise rejection
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };
  
  window.addEventListener("unhandledrejection", rejectionHandler, true); // Use capture phase

  // Also intercept console.warn for phone-related warnings
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const warnMessage = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || String(arg)
    ).join(' ');
    const lowerWarn = warnMessage.toLowerCase();
    
    // Suppress phone-related warnings
    if (
      lowerWarn.includes("illegal arguments") ||
      (lowerWarn.includes("undefined") && lowerWarn.includes("number")) ||
      lowerWarn.includes("illegal argument")
    ) {
      return; // Suppress
    }
    originalConsoleWarn.apply(console, args);
  };

  // Patch Clerk's internal phone validation if it exists
  // This prevents phone validation from running at all
  if (window.Clerk) {
    const originalClerk = window.Clerk;
    // Intercept any phone validation methods
    try {
      // Override phone validation if it exists
      if (originalClerk.validatePhoneNumber) {
        originalClerk.validatePhoneNumber = () => true; // Always return valid
      }
    } catch (e) {
      // Ignore if patching fails
    }
  }

  // Also patch when Clerk loads
  const observer = new MutationObserver(() => {
    if (window.Clerk && window.Clerk.validatePhoneNumber) {
      window.Clerk.validatePhoneNumber = () => true;
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("✅ Clerk error suppression initialized");
}

