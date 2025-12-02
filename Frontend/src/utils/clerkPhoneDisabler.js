// clerkPhoneDisabler.js
// This file MUST be loaded BEFORE Clerk to disable phone validation
// Less aggressive approach - only patches Clerk when it loads

(function() {
  'use strict';
  
  // Wait for Clerk to load, then patch phone validation
  const patchClerk = () => {
    if (window.Clerk) {
      try {
        // Patch Clerk.phone if it exists
        if (window.Clerk.phone) {
          Object.keys(window.Clerk.phone).forEach(key => {
            if (typeof window.Clerk.phone[key] === 'function') {
              const original = window.Clerk.phone[key];
              window.Clerk.phone[key] = function(...args) {
                try {
                  return original.apply(this, args);
                } catch (e) {
                  // Suppress phone validation errors
                  if (e.message && e.message.toLowerCase().includes('phone')) {
                    return true;
                  }
                  throw e;
                }
              };
            }
          });
        }
        
        // Patch validatePhoneNumber if it exists
        if (window.Clerk.validatePhoneNumber) {
          window.Clerk.validatePhoneNumber = function() { return true; };
        }
        
        console.log('✅ Clerk phone validation patched');
      } catch (e) {
        console.warn('Could not patch Clerk phone validation:', e);
      }
    }
  };
  
  // Try to patch immediately if Clerk is already loaded
  patchClerk();
  
  // Watch for Clerk to load
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCount++;
    if (window.Clerk) {
      patchClerk();
      clearInterval(checkInterval);
    } else if (checkCount > 100) {
      // Stop checking after 5 seconds
      clearInterval(checkInterval);
    }
  }, 50);
  
  // Global error suppression - catch phone validation errors
  const originalError = window.onerror;
  window.onerror = function(msg, src, line, col, err) {
    const msgStr = String(msg || '').toLowerCase();
    if (msgStr.includes('illegal argument') || 
        (msgStr.includes('undefined') && msgStr.includes('number')) ||
        (msgStr.includes('phone') && msgStr.includes('validation'))) {
      return true; // Suppress
    }
    if (originalError) return originalError.apply(this, arguments);
    return false;
  };
  
  // Suppress unhandled rejections
  window.addEventListener('unhandledrejection', function(e) {
    const errStr = String(e.reason?.message || e.reason || '').toLowerCase();
    if (errStr.includes('illegal argument') || 
        (errStr.includes('undefined') && errStr.includes('number')) ||
        (errStr.includes('phone') && errStr.includes('validation'))) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  
  console.log('✅ Clerk phone disabler initialized');
})();
