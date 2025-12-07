// sendWhatsApp.js
// WhatsApp Notification Sender using WhatsApp Cloud API
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURATION - PASTE YOUR NEW TOKEN HERE
// ============================================
// Step 1: Generate token from Meta Business Suite → API Setup
// Step 2: Copy the token and paste it below (replace PASTE_NEW_TOKEN_HERE)
const ACCESS_TOKEN = "PASTE_NEW_TOKEN_HERE";
const PHONE_NUMBER_ID = "926454387213927";
const RECIPIENT_NUMBER = "917058733358";

// WhatsApp Cloud API endpoint
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp Notification Sender is running",
    endpoint: "POST /notify"
  });
});

// WhatsApp notification endpoint
app.post("/notify", async (req, res) => {
  try {
    // Validate access token
    if (!ACCESS_TOKEN || ACCESS_TOKEN === "PASTE_NEW_TOKEN_HERE") {
      return res.status(400).json({
        success: false,
        error: "Access token not configured. Please paste your token in sendWhatsApp.js"
      });
    }

    // Prepare the message payload
    const messagePayload = {
      messaging_product: "whatsapp",
      to: RECIPIENT_NUMBER,
      type: "text",
      text: {
        body: "Hello! Your WhatsApp Notification from my website is working 🚀"
      }
    };

    // Send request to WhatsApp Cloud API
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(messagePayload)
    });

    const responseData = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error("WhatsApp API Error:", responseData);
      return res.status(response.status).json({
        success: false,
        error: "Failed to send WhatsApp message",
        details: responseData.error || responseData,
        statusCode: response.status
      });
    }

    // Success response
    console.log("WhatsApp message sent successfully:", responseData);
    res.json({
      success: true,
      message: "WhatsApp notification sent successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "An unexpected error occurred"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Notification Sender running on port ${PORT}`);
  console.log(`📱 Endpoint: http://localhost:${PORT}/notify`);
  if (ACCESS_TOKEN === "PASTE_NEW_TOKEN_HERE") {
    console.log(`⚠️  WARNING: Please paste your ACCESS_TOKEN in the code!`);
  }
});

