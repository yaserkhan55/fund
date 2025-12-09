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
import donorRoutes from "./routes/donorRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";

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

/* RAZORPAY VERIFICATION ROUTES - Frontend handles these pages */
app.get("/shipping-policy", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shipping Policy - SEUMP</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>Shipping Policy</h1>
      <p>This page is handled by the frontend. Please visit the frontend URL for the full policy.</p>
      <p>Frontend URL: ${process.env.FRONTEND_URL || "https://fund-liart.vercel.app"}/shipping-policy</p>
    </body>
    </html>
  `);
});

app.get("/terms-and-conditions", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Terms and Conditions - SEUMP</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>Terms and Conditions</h1>
      <p>This page is handled by the frontend. Please visit the frontend URL for the full terms.</p>
      <p>Frontend URL: ${process.env.FRONTEND_URL || "https://fund-liart.vercel.app"}/terms-and-conditions</p>
    </body>
    </html>
  `);
});

app.get("/refund-policy", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Refund Policy - SEUMP</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>Refund Policy</h1>
      <p>This page is handled by the frontend. Please visit the frontend URL for the full policy.</p>
      <p>Frontend URL: ${process.env.FRONTEND_URL || "https://fund-liart.vercel.app"}/refund-policy</p>
    </body>
    </html>
  `);
});

app.get("/privacy-policy", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Policy - SEUMP</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p>This page is handled by the frontend. Please visit the frontend URL for the full policy.</p>
      <p>Frontend URL: ${process.env.FRONTEND_URL || "https://fund-liart.vercel.app"}/privacy-policy</p>
    </body>
    </html>
  `);
});

// Serve static files from uploads directory with CORS headers
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for static files
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}, express.static("uploads", {
  setHeaders: (res, path) => {
    // Set cache headers for images
    if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    }
  }
}));

/* PUBLIC ROUTES */
app.use("/api", authRoutes);
app.use("/api/google", googleAuthRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/sms", smsRoutes);


/* PROTECTED ROUTES */
app.use("/api/profile", requireAuth(), syncClerkUser, profileRoutes);
app.use("/api/fundraisers", requireAuth(), syncClerkUser, fundraiserRoutes);
// Donations routes - public for viewing, protected for creating (donor JWT auth handled in routes)
app.use("/api/donations", donationRoutes);

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
