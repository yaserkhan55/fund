// sendWhatsApp.js
// WhatsApp Notification Sender using WhatsApp Cloud API
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURATION - UPDATE YOUR ACCESS TOKEN HERE
// ============================================
// ⚠️ IMPORTANT: Replace "PASTE_MY_TOKEN_HERE" below with your actual WhatsApp Cloud API access token
const ACCESS_TOKEN = "EAAZCfaEVVn7EBQNvysKPpeOzABxsnSMrdclqf9yy9LcA9nMBNcotAuEUZA5N1SErua0HycMHrjqSlle9Xk8Tr8v7LGdPzZC3a8ZCaK1IWKGZCAaWHHnA7oUHyQwGMKFsZCJo3kGlu7fZBsIZCmZC46y9g4dZCcdlPoK2raFiQPoZCQdGc6ujppWx6YatWr62QPhiyISzWvrgBkDXdnjnGU6Of12cwZAll2O1HOGEkVVaTZCtLes8XePCw0gkR9MZBJz25X5rnGJtSbpSI44ml3F8GtSCbtHM5F";
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
    if (!ACCESS_TOKEN || ACCESS_TOKEN === "PASTE_MY_TOKEN_HERE") {
      return res.status(400).json({
        success: false,
        error: "Access token not configured. Please set ACCESS_TOKEN in the code."
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
  console.log(`⚠️  Make sure to set your ACCESS_TOKEN in the code!`);
});

