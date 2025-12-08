// routes/whatsappRoutes.js
import express from "express";
import { sendWhatsAppMessage, sendDonationThankYou, sendCampaignCreatedNotification, sendCampaignApprovedNotification } from "../utils/whatsappSender.js";
import { sendTwilioWhatsApp, sendTwilioDonationThankYou, sendTwilioCampaignCreated, sendTwilioCampaignApproved } from "../utils/twilioWhatsAppSender.js";

const router = express.Router();

// Test endpoint - Send a test WhatsApp message
router.post("/test", async (req, res) => {
  try {
    const { recipientNumber, message } = req.body;
    
    const recipient = recipientNumber || "917058733358"; // Default recipient
    const messageText = message || "Hello! Your WhatsApp Notification from my website is working 🚀";
    
    const result = await sendWhatsAppMessage(recipient, messageText);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "WhatsApp notification sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("WhatsApp test error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send donation thank you message
router.post("/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount, campaignTitle } = req.body;
    
    if (!recipientNumber || !amount || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber, amount, and campaignTitle are required"
      });
    }
    
    const result = await sendDonationThankYou(recipientNumber, donorName, amount, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Thank you message sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("WhatsApp donation thank you error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send campaign created notification
router.post("/campaign-created", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;
    
    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }
    
    const result = await sendCampaignCreatedNotification(recipientNumber, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Campaign creation notification sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("WhatsApp campaign created error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send campaign approved notification
router.post("/campaign-approved", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;
    
    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }
    
    const result = await sendCampaignApprovedNotification(recipientNumber, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Campaign approval notification sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("WhatsApp campaign approved error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// ============================================
// TWILIO WHATSAPP ROUTES (Alternative - Easier Setup)
// ============================================

// Test endpoint - Send a test WhatsApp message via Twilio
router.post("/twilio/test", async (req, res) => {
  try {
    const { recipientNumber, message } = req.body;
    
    const recipient = recipientNumber || "+917058733358"; // Format: +917058733358
    const messageText = message || "Hello! Your WhatsApp Notification from my website is working 🚀";
    
    const result = await sendTwilioWhatsApp(recipient, messageText);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Twilio WhatsApp notification sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("Twilio WhatsApp test error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send donation thank you via Twilio
router.post("/twilio/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount, campaignTitle } = req.body;
    
    if (!recipientNumber || !amount || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber, amount, and campaignTitle are required"
      });
    }
    
    const result = await sendTwilioDonationThankYou(recipientNumber, donorName, amount, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Thank you message sent successfully via Twilio",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("Twilio donation thank you error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// ============================================
// TWILIO WHATSAPP ROUTES (Alternative - Easier Setup)
// ============================================

// Test endpoint - Send a test WhatsApp message via Twilio
router.post("/twilio/test", async (req, res) => {
  try {
    const { recipientNumber, message } = req.body;
    
    const recipient = recipientNumber || "+917058733358"; // Format: +917058733358
    const messageText = message || "Hello! Your WhatsApp Notification from my website is working 🚀";
    
    const result = await sendTwilioWhatsApp(recipient, messageText);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Twilio WhatsApp notification sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("Twilio WhatsApp test error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send donation thank you via Twilio
router.post("/twilio/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount, campaignTitle } = req.body;
    
    if (!recipientNumber || !amount || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber, amount, and campaignTitle are required"
      });
    }
    
    const result = await sendTwilioDonationThankYou(recipientNumber, donorName, amount, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Thank you message sent successfully via Twilio",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error("Twilio donation thank you error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

export default router;

