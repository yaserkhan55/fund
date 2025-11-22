import bcrypt from "bcryptjs";
import OtpToken from "../models/OtpToken.js";
import User from "../models/User.js";
import { resend } from "../utils/emailSender.js";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "changeme";

// -------------------------------------------------
// 📩 SEND EMAIL OTP
// -------------------------------------------------
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const otpHash = await bcrypt.hash(otp, 10);

    // Expire in 5 minutes
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove existing OTPs for same email
    await OtpToken.deleteMany({ email });

    // Save new OTP
    await OtpToken.create({
      email,
      otpHash,
      expireAt,
      attempts: 0,
    });

    // Send email via RESEND
    await resend.emails.send({
      from: "onboarding@resend.dev", // free domain
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p style="font-size: 18px;">Your OTP is <strong>${otp}</strong></p>
        <p>Valid for 5 minutes.</p>
      `,
    });

    return res.json({
      success: true,
      message: "OTP sent to your email",
    });

  } catch (err) {
    console.error("❌ OTP send error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// -------------------------------------------------
// ✅ VERIFY EMAIL OTP
// -------------------------------------------------
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email & OTP required",
      });
    }

    const record = await OtpToken.findOne({ email });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    // Expired?
    if (record.expireAt < new Date()) {
      await OtpToken.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, record.otpHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP valid -> delete all for security
    await OtpToken.deleteMany({ email });

    // Create or find user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email,
        password: "email-otp-login",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "OTP verified",
      token,
      user,
    });

  } catch (err) {
    console.error("❌ OTP verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
