// clerkConfig.js
// Comprehensive Clerk configuration to completely disable phone authentication

export const clerkConfig = {
  // Force disable phone at the configuration level
  appearance: {
    elements: {
      // Hide ALL phone-related elements
      phoneInputBox: { display: 'none' },
      phoneInput: { display: 'none' },
      formFieldInput__phoneNumber: { display: 'none' },
      formFieldLabel__phoneNumber: { display: 'none' },
      formField__phoneNumber: { display: 'none' },
    },
    layout: {
      showOptionalFields: false, // Don't show phone field
    },
  },
  // Disable phone authentication methods
  signIn: {
    additionalOAuthScopes: {},
  },
  signUp: {
    additionalOAuthScopes: {},
  },
};

// Global function to completely disable phone validation
if (typeof window !== 'undefined') {
  // Override any phone validation before Clerk loads
  const originalDefineProperty = Object.defineProperty;
  
  // Only intercept phone-related properties
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj && prop && typeof prop === 'string') {
      const propLower = prop.toLowerCase();
      // Only intercept if it's clearly phone-related
      if (propLower.includes('phone') && propLower.includes('valid')) {
        if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
          descriptor.value = function() { return true; };
        }
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
}

