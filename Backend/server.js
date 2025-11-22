// server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import "./config/passport.js"; // <-- IMPORTANT: loads Google OAuth strategy
import connectDB from "./config/db.js";

import campaignRoutes from "./routes/campaignRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import fundraiserRoutes from "./routes/fundraiserRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import emailOtpRoutes from "./routes/emailOtpRoutes.js";

import User from "./models/User.js";

// ENV load
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Debug logs
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "LOADED" : "NOT LOADED");

const app = express();

/* -----------------------------------------------
   CORS
------------------------------------------------ */
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL || "https://fund-liart.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

/* -----------------------------------------------
   SESSION (required for passport)
------------------------------------------------ */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // change to true only if using https
      httpOnly: true,
      sameSite: "lax",
    }
  })
);

/* -----------------------------------------------
   Passport Init
------------------------------------------------ */
app.use(passport.initialize());
app.use(passport.session());

/* -----------------------------------------------
   Root
------------------------------------------------ */
app.get("/", (req, res) => res.send("Fund backend running"));

/* -----------------------------------------------
   Static File Routes
------------------------------------------------ */
app.use("/uploads", express.static("uploads"));

/* -----------------------------------------------
   API Routes
------------------------------------------------ */
app.use("/api/campaigns", campaignRoutes);
app.use("/api/auth", authRoutes);      // Google OAuth included here
app.use("/api/profile", profileRoutes);
app.use("/api/fundraisers", fundraiserRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/email-otp", emailOtpRoutes);

/* -----------------------------------------------
   Create Default Admin
------------------------------------------------ */
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ email: "admin@fund.com", role: "admin" });
    if (adminExists) {
      console.log("Admin already exists:", adminExists.email);
      return;
    }

    const hashed = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || "admin123", 10);

    await User.create({
      name: "Super Admin",
      email: "admin@fund.com",
      password: hashed,
      role: "admin",
    });

    console.log("Default admin created");
  } catch (err) {
    console.error("Admin creation error:", err.message);
  }
}

/* -----------------------------------------------
   Start Server
------------------------------------------------ */
connectDB()
  .then(() => {
    createDefaultAdmin();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Fatal DB Error:", err.message);
  });
