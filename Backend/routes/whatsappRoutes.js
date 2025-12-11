import express from "express";
import {
  sendWhatsAppMessage,
  sendDonationThankYou,
  sendCampaignCreatedNotification,
  sendCampaignApprovedNotification
} from "../utils/whatsappSender.js";

const router = express.Router();

// ================= TEST MESSAGE =================
router.post("/test", async (req, res) => {
  try {
    const recipient = req.body.recipientNumber || "917058733358";
    const message = req.body.message || "Test WhatsApp message is working 🚀";

    const result = await sendWhatsAppMessage(recipient, message);

    result.success
      ? res.json({ success: true, data: result.data })
      : res.status(400).json(result);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= DONATION THANK YOU =================
router.post("/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount, campaignTitle } = req.body;

    if (!recipientNumber || !amount || !campaignTitle)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const result = await sendDonationThankYou(recipientNumber, donorName, amount, campaignTitle);

    result.success
      ? res.json({ success: true, data: result.data })
      : res.status(400).json(result);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= CAMPAIGN CREATED =================
router.post("/campaign-created", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;

    if (!recipientNumber || !campaignTitle)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const result = await sendCampaignCreatedNotification(recipientNumber, campaignTitle);

    result.success
      ? res.json({ success: true, data: result.data })
      : res.status(400).json(result);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= CAMPAIGN APPROVED =================
router.post("/campaign-approved", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;

    if (!recipientNumber || !campaignTitle)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const result = await sendCampaignApprovedNotification(recipientNumber, campaignTitle);

    result.success
      ? res.json({ success: true, data: result.data })
      : res.status(400).json(result);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
