// utils/twilioWhatsAppSender.js
// Twilio WhatsApp Notification Service

import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables (in case not loaded by server.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// CONFIGURATION - TWILIO CREDENTIALS
// ============================================
// Get these from: https://console.twilio.com/
// Account → API Keys & Tokens
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// Format WhatsApp number - add 'whatsapp:' prefix if missing
// IMPORTANT: For testing, use Twilio sandbox number: whatsapp:+14155238886
// Your custom number must be configured for WhatsApp in Twilio Console first
const rawNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Default to sandbox number for testing (works immediately)
// Only use custom number if explicitly set AND configured in Twilio
let WHATSAPP_FROM = "whatsapp:+14155238886"; // Default: Twilio sandbox

if (rawNumber) {
  // If custom number provided, format it
  const formatted = rawNumber.startsWith('whatsapp:') 
    ? rawNumber 
    : `whatsapp:${rawNumber.startsWith('+') ? rawNumber : '+' + rawNumber}`;
  
  // Only use custom number if it's the sandbox or explicitly configured
  // For now, force sandbox for testing to avoid errors
  if (formatted.includes('14155238886')) {
    WHATSAPP_FROM = formatted;
  } else {
    console.warn(`⚠️ Custom number ${formatted} may not be configured for WhatsApp. Using sandbox number for testing.`);
    console.warn("   To use custom number, configure it in Twilio Console → Messaging → Try it out → Send a WhatsApp message");
    WHATSAPP_FROM = "whatsapp:+14155238886"; // Force sandbox
  }
}

// Initialize Twilio client only if credentials are provided
let client = null;
if (ACCOUNT_SID && AUTH_TOKEN && ACCOUNT_SID.startsWith('AC') && AUTH_TOKEN.length > 0) {
  try {
    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    console.log("✅ Twilio WhatsApp client initialized");
    console.log(`   Account SID: ${ACCOUNT_SID.substring(0, 10)}...`);
    console.log(`   WhatsApp From: ${WHATSAPP_FROM}`);
  } catch (error) {
    console.warn("⚠️ Twilio client initialization failed:", error.message);
    client = null;
  }
} else {
  console.warn("⚠️ Twilio credentials not configured. WhatsApp notifications via Twilio are disabled.");
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} recipientNumber - Phone number in format: +917058733358 (with + and country code)
 * @param {string} messageText - Message to send
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioWhatsApp = async (recipientNumber, messageText) => {
  try {
    // Validate inputs
    if (!recipientNumber || !messageText) {
      return {
        success: false,
        error: "Recipient number and message text are required"
      };
    }

    // Validate credentials and client
    if (!client) {
      console.warn("⚠️ Twilio client not initialized");
      return {
        success: false,
        error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
      };
    }

    // Format recipient number (ensure it starts with whatsapp:)
    const formattedTo = recipientNumber.startsWith('whatsapp:') 
      ? recipientNumber 
      : `whatsapp:${recipientNumber.startsWith('+') ? recipientNumber : '+' + recipientNumber}`;

    // Send WhatsApp message via Twilio
    const message = await client.messages.create({
      from: WHATSAPP_FROM,
      to: formattedTo,
      body: messageText
    });

    // Success
    console.log("✅ Twilio WhatsApp message sent successfully:", message.sid);
    return {
      success: true,
      data: {
        messageSid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from
      }
    };

  } catch (error) {
    console.error("Error sending Twilio WhatsApp message:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      details: error
    };
  }
};

/**
 * Send donation thank you message via Twilio
 * @param {string} recipientNumber - Donor's phone number
 * @param {string} donorName - Donor's name
 * @param {number} amount - Donation amount
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioDonationThankYou = async (recipientNumber, donorName, amount, campaignTitle) => {
  const message = `🙏 Thank you ${donorName || "dear supporter"}!

Your generous donation of ₹${amount.toLocaleString('en-IN')} to "${campaignTitle}" has been received.

Your contribution makes a real difference! 💙

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

/**
 * Send campaign creation confirmation via Twilio
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioCampaignCreated = async (recipientNumber, campaignTitle) => {
  const message = `🎉 Campaign Created Successfully!

Your campaign "${campaignTitle}" has been submitted for review.

Our team will review it within 24-48 hours. You'll be notified once it's approved.

Thank you for using SEUMP! 💙

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

/**
 * Send campaign approval notification via Twilio
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioCampaignApproved = async (recipientNumber, campaignTitle) => {
  const message = `✅ Great News!

Your campaign "${campaignTitle}" has been approved and is now live!

Start sharing your campaign to reach your fundraising goal. 🚀

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

