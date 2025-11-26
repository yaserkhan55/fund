// middlewares/syncClerkUser.js
// Ensures Clerk users are synced to MongoDB User collection

import User from "../models/User.js";
import ClerkProfile from "../models/ClerkProfile.js";
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
    let clerkPayload = null;

    if (!mongoUser) {
      try {
        // Fetch user details from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        clerkPayload = clerkUser;

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
        const lowerEmail = email.toLowerCase();
        const existingByEmail = await User.findOne({ email: lowerEmail });
        
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
            email: lowerEmail,
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

    try {
      // Always ensure ClerkProfile is stored/updated for this user (simple no-webhook setup)
      const payload =
        clerkPayload ||
        (await clerkClient.users.getUser(clerkUserId).catch(() => null));

      if (payload) {
        const primaryEmailId = payload.primaryEmailAddressId || payload.primary_email_address_id;
        const emailList =
          payload.emailAddresses || payload.email_addresses || [];
        const primaryEmail =
          emailList.find((e) => e.id === primaryEmailId)?.emailAddress ||
          emailList[0]?.email_address ||
          emailList[0]?.emailAddress ||
          mongoUser.email;

        await ClerkProfile.findOneAndUpdate(
          { clerkId: clerkUserId },
          {
            clerkId: clerkUserId,
            email: (primaryEmail || mongoUser.email || "").toLowerCase(),
            firstName: payload.firstName || payload.first_name || "",
            lastName: payload.lastName || payload.last_name || "",
            username: payload.username || "",
            imageUrl: payload.imageUrl || payload.image_url || "",
            phoneNumbers: (payload.phoneNumbers || payload.phone_numbers || []).map(
              (p) => p.phoneNumber || p.phone_number
            ),
            primaryEmailId: primaryEmailId || "",
            status: payload.deleted ? "deleted" : "active",
            lastSyncedAt: new Date(),
            raw: payload,
            deletedAt: payload.deleted ? new Date() : null,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (profileErr) {
      console.error("Error syncing ClerkProfile:", profileErr);
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

