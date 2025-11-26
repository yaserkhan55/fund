import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/*
  This API is called after Google Sign-In through Clerk.
  Clerk sends: email, name, clerkToken
  We return: your JWT + backend user record
*/

router.post("/google-auth", async (req, res) => {
  try {
    const { email, name, clerkId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email missing" });
    }

    console.log(`🔄 Syncing user to MongoDB: ${email}, Clerk ID: ${clerkId || 'none'}`);

    // Check if user already exists (by email or Clerk ID)
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        ...(clerkId ? [{ clerkId }] : [])
      ]
    });

    // If first time → create user
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0] || "User",
        email: email.toLowerCase(),
        password: "clerk-auth", // Placeholder for Clerk/Google users
        provider: "clerk", // Default to clerk for Clerk-authenticated users
        clerkId: clerkId || null,
        role: "user"
      });
      console.log(`✅ Created new MongoDB user: ${email} (ID: ${user._id}, Clerk ID: ${clerkId || 'none'})`);
    } else {
      // Update existing user if needed
      if (clerkId && !user.clerkId) {
        user.clerkId = clerkId;
        user.provider = user.provider || "clerk";
        if (name && name !== user.name) {
          user.name = name;
        }
        await user.save();
        console.log(`✅ Updated existing user with Clerk ID: ${email} (MongoDB ID: ${user._id})`);
      } else if (clerkId && user.clerkId !== clerkId) {
        // Update Clerk ID if different
        user.clerkId = clerkId;
        await user.save();
        console.log(`✅ Updated Clerk ID for user: ${email}`);
      }
    }

    // Create your own JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      user,
      token
    });

  } catch (err) {
    console.error("Google/Clerk auth error:", err);
    return res.status(500).json({ success: false, message: "Auth failed", error: err.message });
  }
});

export default router;
