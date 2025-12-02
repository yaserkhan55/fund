// middlewares/checkUserType.js
// Middleware to check user type from Clerk metadata and MongoDB

import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

/**
 * Middleware to check if user has required userType
 * Usage: router.get("/route", requireAuth, checkUserType("campaign_creator"), handler)
 */
export const checkUserType = (requiredType) => {
  return async (req, res, next) => {
    try {
      const clerkUserId = req.auth?.userId;
      
      if (!clerkUserId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // First check MongoDB user
      const mongoUser = await User.findOne({ clerkId: clerkUserId });
      
      if (mongoUser) {
        // Check userType from MongoDB
        if (mongoUser.userType === requiredType || mongoUser.userType === "both") {
          req.userType = mongoUser.userType;
          return next();
        }
      }

      // Also check Clerk metadata as fallback
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const clerkUserType = clerkUser.publicMetadata?.userType || 
                             clerkUser.privateMetadata?.userType;
        
        if (clerkUserType === requiredType || clerkUserType === "both") {
          req.userType = clerkUserType;
          return next();
        }
      } catch (clerkError) {
        console.error("Error fetching Clerk user:", clerkError);
      }

      // User doesn't have required type
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires ${requiredType} user type.`
      });
    } catch (error) {
      console.error("Error in checkUserType middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking user type"
      });
    }
  };
};

/**
 * Middleware to get user type without blocking (for info purposes)
 */
export const getUserType = async (req, res, next) => {
  try {
    const clerkUserId = req.auth?.userId;
    
    if (!clerkUserId) {
      req.userType = null;
      return next();
    }

    // Check MongoDB first
    const mongoUser = await User.findOne({ clerkId: clerkUserId });
    if (mongoUser?.userType) {
      req.userType = mongoUser.userType;
      return next();
    }

    // Check Clerk metadata
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const clerkUserType = clerkUser.publicMetadata?.userType || 
                           clerkUser.privateMetadata?.userType;
      req.userType = clerkUserType || "campaign_creator";
    } catch (error) {
      req.userType = "campaign_creator"; // Default
    }
    
    next();
  } catch (error) {
    req.userType = null;
    next();
  }
};

