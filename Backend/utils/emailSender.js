// utils/emailSender.js
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing from .env");
}

export const resend = new Resend(process.env.RESEND_API_KEY);
