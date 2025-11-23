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

    // Check if this Google user already exists
    let user = await User.findOne({ email });

    // If first time → create user
    if (!user) {
      user = await User.create({
        name,
        email,
        password: "", // Google users have no password
        role: "user"
      });
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
    console.error("Google auth error:", err);
    return res.status(500).json({ success: false, message: "Google auth failed" });
  }
});

export default router;
