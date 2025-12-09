// Quick test script for SMS functionality
// Run: node test-sms.js

import dotenv from 'dotenv';
dotenv.config();

import { sendDonationThankYouSMS } from './utils/fast2smsSender.js';

const testPhone = process.argv[2] || "917058733358"; // Default test number
const testName = "Test User";
const testAmount = 100;
const testCampaign = "Test Campaign";

console.log("🧪 Testing SMS functionality...");
console.log(`📱 Phone: ${testPhone}`);
console.log(`👤 Name: ${testName}`);
console.log(`💰 Amount: ₹${testAmount}`);
console.log(`📋 Campaign: ${testCampaign}`);
console.log("");

try {
  const result = await sendDonationThankYouSMS(testPhone, testName, testAmount, testCampaign);
  
  if (result.success) {
    console.log("✅ SMS sent successfully!");
    console.log("📊 Result:", result.data);
  } else {
    console.log("❌ SMS failed!");
    console.log("📊 Error:", result.error);
    if (result.isLimitReached) {
      console.log("⚠️ Daily limit reached (10 SMS/day)");
    }
  }
} catch (error) {
  console.error("❌ Error:", error.message);
}

process.exit(0);

