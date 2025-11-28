// server.js
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
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";

import User from "./models/User.js";

import { clerkMiddleware, requireAuth } from "@clerk/express";
import { handleClerkWebhook } from "./controllers/clerkController.js";
import { syncClerkUser } from "./middlewares/syncClerkUser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

/* --------------------------
   CORS FIXED ✔
--------------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL || "https://fund-liart.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(cookieParser());

// Clerk webhooks require raw body for signature verification
app.post(
  "/api/clerk/webhook",
  express.raw({ type: "application/json" }),
  handleClerkWebhook
);

app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) =>
  res.send("Fund backend running correctly ✔")
);

app.use("/uploads", express.static("uploads"));

/* PUBLIC ROUTES */
app.use("/api", authRoutes);
app.use("/api/google", googleAuthRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/contact", contactRoutes);

/* PROTECTED ROUTES */
app.use("/api/profile", requireAuth(), syncClerkUser, profileRoutes);
app.use("/api/fundraisers", requireAuth(), syncClerkUser, fundraiserRoutes);
app.use("/api/donations", requireAuth(), syncClerkUser, donationRoutes);

/* ADMIN ROUTES */
app.use("/api/admin", adminRoutes);

/* DEFAULT ADMIN */
async function createDefaultAdmin() {
  try {
    const existing = await User.findOne({
      email: "admin@fund.com",
      role: "admin",
    });

    if (!existing) {
      const hashed = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
        10
      );

      await User.create({
        name: "Super Admin",
        email: "admin@fund.com",
        password: hashed,
        role: "admin",
      });

      console.log("Default admin created ✔");
    }
  } catch (err) {
    console.error("Admin creation error:", err.message);
  }
}

connectDB().then(() => {
  createDefaultAdmin();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
