// utils/emailSender.js
import nodemailer from "nodemailer";

const buildTransporter = () => {
  // Create transporter using SMTP (works well on Render). Use STARTTLS on 587.
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    requireTLS: true,
    tls: {
      // render's environment may have an internal cert; avoid failing due to cert verification
      rejectUnauthorized: false,
    },
    // Connection timeouts (ms)
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  return transporter;
};

const transporter = buildTransporter();

// Verify transporter on startup (non-blocking) and log result
transporter.verify((err, success) => {
  if (err) {
    console.error("⚠️  Nodemailer verify failed:", err && err.message ? err.message : err);
    console.error("Make sure EMAIL_USER and EMAIL_PASS (app password) are set in Render env vars.");
  } else {
    console.log("✅ Nodemailer transporter verified (SMTP connection ready).");
  }
});

export default transporter;
