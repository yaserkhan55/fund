// utils/tokenManager.js
// WhatsApp Token Management - Handles token expiration and refresh

/**
 * Get WhatsApp Access Token
 * Priority: Environment Variable > Long-lived Token > Temporary Token
 */
export const getWhatsAppToken = () => {
  // Option 1: Environment Variable (Best for production)
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    return process.env.WHATSAPP_ACCESS_TOKEN;
  }

  // Option 2: Long-lived Token (60 days validity)
  // Generate from: https://developers.facebook.com/tools/explorer/
  // Exchange short-lived token for long-lived token
  const LONG_LIVED_TOKEN = process.env.WHATSAPP_LONG_LIVED_TOKEN || null;
  if (LONG_LIVED_TOKEN) {
    return LONG_LIVED_TOKEN;
  }

  // Option 3: Temporary Token (1-2 hours - for testing only)
  const TEMP_TOKEN = process.env.WHATSAPP_TEMP_TOKEN || null;
  if (TEMP_TOKEN) {
    console.warn("⚠️ Using temporary token - will expire in 1-2 hours. Use long-lived token for production!");
    return TEMP_TOKEN;
  }

  // Fallback: Hardcoded (not recommended for production)
  return null;
};

/**
 * Check if token is expired (basic validation)
 */
export const isTokenExpired = (errorMessage) => {
  if (!errorMessage) return false;
  
  const expiredPatterns = [
    /session has expired/i,
    /token expired/i,
    /invalid.*token/i,
    /session.*invalid/i
  ];

  return expiredPatterns.some(pattern => pattern.test(errorMessage));
};

/**
 * Get token expiration info
 */
export const getTokenInfo = () => {
  const token = getWhatsAppToken();
  if (!token) {
    return {
      type: "none",
      expires: null,
      message: "No token configured"
    };
  }

  // Check if it's from environment variable (assumed long-lived)
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    return {
      type: "environment",
      expires: "Never (if using System User token)",
      message: "Using environment variable token"
    };
  }

  // Check if it's long-lived
  if (process.env.WHATSAPP_LONG_LIVED_TOKEN) {
    return {
      type: "long-lived",
      expires: "60 days",
      message: "Using long-lived token (valid for 60 days)"
    };
  }

  // Must be temporary
  return {
    type: "temporary",
    expires: "1-2 hours",
    message: "⚠️ Using temporary token - will expire soon!"
  };
};

