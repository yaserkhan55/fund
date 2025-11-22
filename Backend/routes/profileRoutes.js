import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// GET logged-in user data
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE profile data
router.put("/update", protect, async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      email: req.body.email,
      occupation: req.body.occupation,
      education: req.body.education,
      address: req.body.address,
      dob: req.body.dob,
      gender: req.body.gender,
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json(updatedUser);

  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// UPDATE PASSWORD
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match)
      return res.status(400).json({ message: "Wrong password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated" });

  } catch (err) {
    res.status(500).json({ message: "Error updating password" });
  }
});

export default router;
