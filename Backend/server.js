import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import fundraiserRoutes from "./routes/fundraiserRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";

import User from "./models/User.js";

// Clerk (correct import)
import { clerkMiddleware, requireAuth } from "@clerk/express";

// ENV
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

/* CORS */
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL || "https://fund-liart.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Clerk Auth Middleware (must be placed before routes)
app.use(clerkMiddleware());

/* Root */
app.get("/", (req, res) => res.send("Fund backend running with Clerk Auth 🔐"));

/* Static */
app.use("/uploads", express.static("uploads"));

/* Protected Routes — only logged-in Clerk users can access */
app.use("/api/campaigns", requireAuth(), campaignRoutes);
app.use("/api/profile", requireAuth(), profileRoutes);
app.use("/api/fundraisers", requireAuth(), fundraiserRoutes);
app.use("/api/donations", requireAuth(), donationRoutes);

/* Admin (NOT Clerk protected — uses your own JWT) */
app.use("/api/admin", adminRoutes);

/* Remove old auth routes */
// ❌ app.use("/api/auth", authRoutes); // REMOVED COMPLETELY


/* ----------------------------------------------------------
   DEFAULT ADMIN SETUP  (THIS IS WHERE YOUR MESSAGE APPEARS)
----------------------------------------------------------- */
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ email: "admin@fund.com", role: "admin" });

    if (!adminExists) {
      const hashed = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || "admin123", 10);

      await User.create({
        name: "Super Admin",
        email: "admin@fund.com",
        password: hashed,
        role: "admin",
      });

      console.log("Default admin created");
    } else {
      console.log("Admin already exists:", adminExists.email);  // ✅ ADDED FOR SATISFACTION
    }

  } catch (err) {
    console.error("Admin creation error:", err.message);
  }
}


/* Start Server */
connectDB()
  .then(() => {
    createDefaultAdmin();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Fatal DB Error:", err.message);
  });
