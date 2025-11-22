import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const SECRET = process.env.JWT_SECRET || "secret123";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = "https://fund-liart.vercel.app";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

/* GOOGLE REDIRECT CALLBACK */
export const googleCallback = async (req, res) => {
  const idToken = req.body?.credential || req.query?.credential;
  if (!idToken) return res.status(400).send("Missing credential");

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ googleId }) ||
             await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      picture,
      provider: "google",
      password: "google-auth"
    });
  }

  const token = jwt.sign({ id: user._id }, SECRET, {
    expiresIn: "7d",
  });

  return res.redirect(
    `https://fund-liart.vercel.app/login-success?token=${encodeURIComponent(token)}`
  );
};

/* OTP SEND */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.json({ success: false, message: "Phone number required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    global.otpStore = global.otpStore || {};
    global.otpStore[phone] = otp;

    console.log("OTP for", phone, "=", otp);

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* OTP VERIFY */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!global.otpStore || global.otpStore[phone] != otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name: "User" + phone,
        email: `${phone}@otp-login.com`,
        password: "otp-login",
        phone,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "7d" }
    );

    delete global.otpStore[phone];

    res.json({
      success: true,
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
