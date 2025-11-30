import Donor from "../models/Donor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../utils/sendOTPEmail.js";

// Generate JWT Token
const generateToken = (donorId) => {
  return jwt.sign({ donorId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "30d",
  });
};

// ✅ REGISTER DONOR
export const registerDonor = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if donor already exists
    const existingDonor = await Donor.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: "Donor with this email or phone already exists",
      });
    }

    // Create donor
    const donor = await Donor.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
    });

    // Generate OTP for email verification
    const otp = donor.generateOTP();
    await donor.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(donor.email, otp, donor.name);
    
    // In development, also log OTP if email fails
    if (!emailResult.success) {
      console.log(`⚠️ Email sending failed. OTP for ${donor.email}: ${otp}`);
    }

    // Generate token
    const token = generateToken(donor._id);

    res.status(201).json({
      success: true,
      message: "Donor registered successfully. Please check your email for OTP verification.",
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        isEmailVerified: donor.isEmailVerified,
      },
      token,
      otpSent: emailResult.success,
      // In development mode, return OTP if email failed (remove in production)
      ...(process.env.NODE_ENV === "development" && !emailResult.success && { devOtp: otp }),
    });
  } catch (error) {
    console.error("Donor registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register donor",
    });
  }
};

// ✅ VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const donor = await Donor.findOne({ email: email.toLowerCase() });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // Allow skipping OTP verification (for convenience)
    const skipOTP = req.body.skipOTP === true || req.body.skipOTP === "true";
    
    if (skipOTP) {
      // Skip OTP verification - mark as verified
      donor.isEmailVerified = true;
      donor.otp = null;
      donor.otpExpires = null;
      await donor.save();

      const token = generateToken(donor._id);

      return res.json({
        success: true,
        message: "Account activated successfully (OTP skipped)",
        donor: {
          id: donor._id,
          name: donor.name,
          email: donor.email,
          isEmailVerified: donor.isEmailVerified,
        },
        token,
      });
    }

    // Verify OTP
    if (donor.verifyOTP(otp)) {
      donor.isEmailVerified = true;
      donor.otp = null;
      donor.otpExpires = null;
      await donor.save();

      const token = generateToken(donor._id);

      return res.json({
        success: true,
        message: "Email verified successfully",
        donor: {
          id: donor._id,
          name: donor.name,
          email: donor.email,
          isEmailVerified: donor.isEmailVerified,
        },
        token,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. You can skip OTP verification if needed.",
      });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
};

// ✅ RESEND OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const donor = await Donor.findOne({ email: email.toLowerCase() });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const otp = donor.generateOTP();
    await donor.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(donor.email, otp, donor.name);
    
    // In development, also log OTP if email fails
    if (!emailResult.success) {
      console.log(`⚠️ Email sending failed. Resent OTP for ${donor.email}: ${otp}`);
    }

    res.json({
      success: true,
      message: emailResult.success ? "OTP sent successfully to your email" : "OTP generated. Please check your email.",
      otpSent: emailResult.success,
      // In development mode, return OTP if email failed (remove in production)
      ...(process.env.NODE_ENV === "development" && !emailResult.success && { devOtp: otp }),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
    });
  }
};

// ✅ LOGIN DONOR
export const loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find donor with password
    const donor = await Donor.findOne({ email: email.toLowerCase() }).select("+password");

    if (!donor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is blocked
    if (donor.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // Check if account is active
    if (!donor.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await donor.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(donor._id);

    res.json({
      success: true,
      message: "Login successful",
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        isEmailVerified: donor.isEmailVerified,
        totalDonated: donor.totalDonated,
        totalDonations: donor.totalDonations,
      },
      token,
    });
  } catch (error) {
    console.error("Donor login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to login",
    });
  }
};

// ✅ GET DONOR PROFILE
export const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.donorId).select("-password -otp");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.json({
      success: true,
      donor,
    });
  } catch (error) {
    console.error("Get donor profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get donor profile",
    });
  }
};

// ✅ UPDATE DONOR PROFILE
export const updateDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.donorId);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const { name, address, city, state, pincode, emailNotifications, smsNotifications } = req.body;

    if (name) donor.name = name.trim();
    if (address) donor.address = address.trim();
    if (city) donor.city = city.trim();
    if (state) donor.state = state.trim();
    if (pincode) donor.pincode = pincode.trim();
    if (emailNotifications !== undefined) donor.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) donor.smsNotifications = smsNotifications;

    await donor.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        address: donor.address,
        city: donor.city,
        state: donor.state,
        pincode: donor.pincode,
        emailNotifications: donor.emailNotifications,
        smsNotifications: donor.smsNotifications,
      },
    });
  } catch (error) {
    console.error("Update donor profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ✅ CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const donor = await Donor.findById(req.donorId).select("+password");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const isPasswordValid = await donor.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    donor.password = newPassword;
    await donor.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};

