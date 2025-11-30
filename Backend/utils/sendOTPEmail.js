// utils/sendOTPEmail.js
import nodemailer from "nodemailer";

// Create email transporter
const createTransporter = () => {
  // Try Gmail first
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    });
  }

  // Try custom SMTP
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
};

// Send OTP Email
export const sendOTPEmail = async (email, otp, name) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`⚠️ Email not configured. OTP for ${email}: ${otp}`);
    return { success: false, message: "Email service not configured" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@seump.com",
    to: email,
    subject: "Verify Your Email - SEUMP Donor Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #00B5B8; color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">SEUMP</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Donor Account Verification</p>
            </div>
          </div>

          <!-- Content -->
          <div style="color: #333333;">
            <h2 style="color: #003d3b; font-size: 24px; margin-bottom: 20px;">Hello ${name || "Donor"}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
              Thank you for registering as a donor on SEUMP. To complete your registration, please verify your email address using the OTP below:
            </p>

            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #00B5B8 0%, #009EA1 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">Your Verification Code</p>
              <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; margin: 10px 0;">
                <p style="font-size: 36px; font-weight: bold; color: #00B5B8; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </p>
              </div>
              <p style="color: white; font-size: 12px; margin: 15px 0 0 0; opacity: 0.9;">
                This code will expire in 10 minutes
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #777777; margin-top: 30px;">
              If you didn't create an account on SEUMP, please ignore this email.
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #777777; margin-top: 20px;">
              Best regards,<br>
              <strong style="color: #003d3b;">SEUMP Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="font-size: 12px; color: #999999; margin: 0;">
              © ${new Date().getFullYear()} SEUMP. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name || "Donor"}!

      Thank you for registering as a donor on SEUMP.

      Your verification code is: ${otp}

      This code will expire in 10 minutes.

      If you didn't create an account, please ignore this email.

      Best regards,
      SEUMP Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    // Still log OTP for development
    console.log(`⚠️ OTP for ${email}: ${otp}`);
    return { success: false, message: error.message, otp }; // Return OTP in dev mode
  }
};

