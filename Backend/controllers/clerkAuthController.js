// controllers/clerkAuthController.js
// Unified Clerk authentication with user type support

import User from "../models/User.js";
import Donor from "../models/Donor.js";
import { clerkClient } from "@clerk/express";
import jwt from "jsonwebtoken";

/**
 * Sync Clerk user to MongoDB with user type
 * POST /api/auth/clerk-sync
 * Body: { clerkId, email, name, imageUrl, userType: "campaign_creator" | "donor" }
 */
export const syncClerkUser = async (req, res) => {
  try {
    const { clerkId, email, name, imageUrl } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: "clerkId and email are required"
      });
    }

    // Find or create User (campaign creator)
    let user = await User.findOne({ 
      $or: [
        { clerkId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // Update existing user
      user.clerkId = clerkId;
      user.name = name || user.name;
      user.picture = imageUrl || user.picture;
      await user.save();
    } else {
      // Create new user - simple, no userType restrictions
      user = await User.create({
        name: name || "User",
        email: email.toLowerCase(),
        clerkId,
        picture: imageUrl || "",
        provider: "clerk",
        password: "clerk-auth",
        role: "user"
      });
    }

    // Also sync to Donor collection if user wants to donate (optional)
    // This allows users to both create campaigns AND donate
    if (req.body.syncDonor) {
      let donor = await Donor.findOne({
        $or: [
          { clerkId },
          { email: email.toLowerCase() }
        ]
      });

      if (donor) {
        // Update existing donor
        donor.clerkId = clerkId;
        donor.name = name || donor.name;
        donor.profilePicture = imageUrl || donor.profilePicture;
        donor.isEmailVerified = true;
        await donor.save();
      } else {
        // Create new donor
        donor = await Donor.create({
          name: name || "Donor",
          email: email.toLowerCase(),
          clerkId,
          profilePicture: imageUrl || "",
          provider: "google",
          isEmailVerified: true,
          isActive: true
        });
      }
    }

    // Generate JWT token for backward compatibility
    const token = jwt.sign(
      { userId: user._id, clerkId },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        clerkId: user.clerkId
      },
      message: "User synced successfully"
    });
  } catch (error) {
    console.error("Error syncing Clerk user:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync user"
    });
  }
};

