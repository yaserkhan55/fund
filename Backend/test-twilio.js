// test-twilio.js
// Quick test script for Twilio WhatsApp

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTwilioWhatsApp } from './utils/twilioWhatsAppSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testTwilio() {
  console.log('🧪 Testing Twilio WhatsApp...\n');
  
  // Check credentials
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'YOUR_ACCOUNT_SID_HERE') {
    console.error('❌ Error: TWILIO_ACCOUNT_SID not set in .env file');
    console.log('📝 Add to Backend/.env:');
    console.log('   TWILIO_ACCOUNT_SID=your_account_sid_here');
    process.exit(1);
  }
  
  if (!process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
    console.error('❌ Error: TWILIO_AUTH_TOKEN not set in .env file');
    console.log('📝 Add to Backend/.env:');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token_here');
    process.exit(1);
  }
  
  console.log('✅ Credentials found in .env');
  console.log(`📱 Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
  console.log(`📱 WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'}\n`);
  
  // Test sending message
  const recipientNumber = process.argv[2] || '+917058733358';
  const message = process.argv[3] || 'Hello! Twilio WhatsApp test message 🚀';
  
  console.log(`📤 Sending message to: ${recipientNumber}`);
  console.log(`💬 Message: ${message}\n`);
  
  try {
    const result = await sendTwilioWhatsApp(recipientNumber, message);
    
    if (result.success) {
      console.log('✅ SUCCESS! Message sent successfully\n');
      console.log('📊 Details:');
      console.log(`   Message SID: ${result.data.messageSid}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   To: ${result.data.to}`);
      console.log(`   From: ${result.data.from}\n`);
      console.log('📱 Check WhatsApp on your phone!');
    } else {
      console.error('❌ FAILED! Error sending message\n');
      console.error('Error:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ EXCEPTION! Error occurred\n');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run test
testTwilio();

