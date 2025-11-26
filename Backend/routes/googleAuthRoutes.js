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
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email missing" });
    }

    // Check if user already exists (by email or Clerk ID)
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { clerkId: req.body.clerkId }
      ]
    });

    // If first time → create user
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0] || "User",
        email: email.toLowerCase(),
        password: "clerk-auth", // Placeholder for Clerk/Google users
        provider: "clerk", // Default to clerk for Clerk-authenticated users
        role: "user"
      });
      console.log(`✅ Created new MongoDB user: ${email} (ID: ${user._id})`);
    } else {
      // Update existing user if needed
      if (req.body.clerkId && !user.clerkId) {
        user.clerkId = req.body.clerkId;
        user.provider = user.provider || "clerk";
        await user.save();
        console.log(`✅ Updated existing user with Clerk ID: ${email}`);
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
