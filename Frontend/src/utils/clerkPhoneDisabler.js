// clerkPhoneDisabler.js
// This file MUST be loaded BEFORE Clerk to completely disable phone validation
// It patches Clerk's internal methods to prevent phone validation from running

(function() {
  'use strict';
  
  // Store original methods before Clerk loads
  const originalMethods = {};
  
  // Intercept Object.defineProperty to catch Clerk's phone validation setup
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    // If Clerk is trying to set up phone validation, neutralize it
    if (prop && typeof prop === 'string' && (
      prop.toLowerCase().includes('phone') ||
      prop.toLowerCase().includes('number')
    )) {
      // Replace phone validation methods with no-ops
      if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
        descriptor.value = function() {
          return true; // Always return valid
        };
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Intercept Function.prototype to catch phone validation functions
  const originalCall = Function.prototype.call;
  Function.prototype.call = function(thisArg, ...args) {
    // Check if this is a phone validation function
    const funcStr = this.toString().toLowerCase();
    if (funcStr.includes('phone') && (funcStr.includes('validate') || funcStr.includes('number'))) {
      return true; // Always return valid
    }
    return originalCall.apply(this, [thisArg, ...args]);
  };
  
  // Patch window.Clerk when it becomes available
  const clerkProxy = new Proxy({}, {
    get: function(target, prop) {
      // If accessing phone-related properties, return no-op functions
      if (typeof prop === 'string' && prop.toLowerCase().includes('phone')) {
        return function() { return true; };
      }
      return target[prop];
    },
    set: function(target, prop, value) {
      // If setting phone-related properties, replace with no-op
      if (typeof prop === 'string' && prop.toLowerCase().includes('phone')) {
        target[prop] = function() { return true; };
      } else {
        target[prop] = value;
      }
      return true;
    }
  });
  
  // Set up a watcher for window.Clerk
  let clerkCheckInterval = setInterval(() => {
    if (window.Clerk) {
      clearInterval(clerkCheckInterval);
      
      // Patch Clerk object
      const clerk = window.Clerk;
      
      // Override any phone validation methods
      if (clerk.phone) {
        Object.keys(clerk.phone).forEach(key => {
          if (typeof clerk.phone[key] === 'function') {
            clerk.phone[key] = function() { return true; };
          }
        });
      }
      
      // Override validatePhoneNumber if it exists
      if (clerk.validatePhoneNumber) {
        clerk.validatePhoneNumber = function() { return true; };
      }
      
      // Proxy Clerk to intercept phone calls
      window.Clerk = new Proxy(clerk, {
        get: function(target, prop) {
          if (typeof prop === 'string' && prop.toLowerCase().includes('phone')) {
            return function() { return true; };
          }
          return target[prop];
        }
      });
      
      console.log('✅ Clerk phone validation disabled');
    }
  }, 50);
  
  // Stop checking after 10 seconds
  setTimeout(() => {
    clearInterval(clerkCheckInterval);
  }, 10000);
  
  // Global error suppression - catch errors at the lowest level
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorStr = String(message || error?.message || '').toLowerCase();
    
    if (
      errorStr.includes('illegal argument') ||
      (errorStr.includes('undefined') && errorStr.includes('number')) ||
      errorStr.includes('phone')
    ) {
      return true; // Suppress completely
    }
    
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Suppress unhandled rejections
  window.addEventListener('unhandledrejection', function(event) {
    const errorStr = String(event.reason?.message || event.reason || '').toLowerCase();
    
    if (
      errorStr.includes('illegal argument') ||
      (errorStr.includes('undefined') && errorStr.includes('number')) ||
      errorStr.includes('phone')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  console.log('✅ Clerk phone disabler initialized');
})();

