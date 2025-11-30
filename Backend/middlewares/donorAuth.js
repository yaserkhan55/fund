import jwt from "jsonwebtoken";
import Donor from "../models/Donor.js";

// Middleware to authenticate donor
export const donorAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // Find donor
    const donor = await Donor.findById(decoded.donorId);

    if (!donor) {
      return res.status(401).json({
        success: false,
        message: "Donor not found. Please login again.",
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

    // Attach donor to request
    req.donorId = donor._id;
    req.donor = donor;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }
    console.error("Donor auth error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

