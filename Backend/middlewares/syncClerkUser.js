// middlewares/syncClerkUser.js
// Ensures Clerk users are synced to MongoDB User collection

import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

/**
 * Middleware to sync Clerk user to MongoDB
 * This ensures every Clerk user has a corresponding MongoDB User document
 */
export const syncClerkUser = async (req, res, next) => {
  try {
    const clerkUserId = req.auth?.userId;
    
    if (!clerkUserId) {
      return next(); // No user, continue (might be public route)
    }

    // Check if user already exists in MongoDB
    let mongoUser = await User.findOne({ 
      $or: [
        { clerkId: clerkUserId },
        { email: req.auth?.sessionClaims?.email }
      ]
    });

    // If user doesn't exist, create it from Clerk data
    if (!mongoUser) {
      try {
        // Fetch user details from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                     req.auth?.sessionClaims?.email || 
                     `${clerkUserId}@clerk-user.com`;
        
        const name = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || 
            clerkUser.username || 
            clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
            "User";

        // Check if email already exists (might be from different auth method)
        const existingByEmail = await User.findOne({ email: email.toLowerCase() });
        
        if (existingByEmail) {
          // Update existing user with Clerk ID
          existingByEmail.clerkId = clerkUserId;
          existingByEmail.picture = clerkUser.imageUrl || existingByEmail.picture;
          await existingByEmail.save();
          mongoUser = existingByEmail;
          console.log(`✅ Updated existing user with Clerk ID: ${email}`);
        } else {
          // Create new user
          mongoUser = await User.create({
            name,
            email: email.toLowerCase(),
            clerkId: clerkUserId,
            picture: clerkUser.imageUrl || "",
            provider: "clerk",
            password: "clerk-auth", // Placeholder, Clerk handles auth
            role: "user"
          });
          console.log(`✅ Created new MongoDB user from Clerk: ${email} (ID: ${mongoUser._id})`);
        }
      } catch (clerkError) {
        console.error("Error fetching Clerk user:", clerkError);
        // Fallback: create user with minimal info
        const email = req.auth?.sessionClaims?.email || `${clerkUserId}@clerk-user.com`;
        mongoUser = await User.create({
          name: "User",
          email: email.toLowerCase(),
          clerkId: clerkUserId,
          provider: "clerk",
          password: "clerk-auth",
          role: "user"
        });
        console.log(`✅ Created fallback MongoDB user for Clerk ID: ${clerkUserId}`);
      }
    }

    // Attach MongoDB user ID to request for use in controllers
    req.mongoUserId = mongoUser._id.toString();
    req.mongoUser = mongoUser;
    
    next();
  } catch (error) {
    console.error("Error in syncClerkUser middleware:", error);
    // Don't block the request, just log the error
    next();
  }
};

