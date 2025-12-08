// check-twilio-credentials.js
// Debug script to check Twilio credentials

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Checking Twilio Credentials...\n');

// Check each variable
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('📋 Environment Variables Status:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check ACCOUNT_SID
if (ACCOUNT_SID) {
  console.log('✅ TWILIO_ACCOUNT_SID: Found');
  console.log(`   Value: ${ACCOUNT_SID.substring(0, 10)}...${ACCOUNT_SID.substring(ACCOUNT_SID.length - 4)}`);
  console.log(`   Length: ${ACCOUNT_SID.length} characters`);
  console.log(`   Starts with AC: ${ACCOUNT_SID.startsWith('AC') ? '✅ Yes' : '❌ No'}`);
  if (!ACCOUNT_SID.startsWith('AC')) {
    console.log('   ⚠️  WARNING: Account SID should start with "AC"');
  }
} else {
  console.log('❌ TWILIO_ACCOUNT_SID: NOT FOUND');
  console.log('   Add to .env: TWILIO_ACCOUNT_SID=your_account_sid_here');
}

console.log('');

// Check AUTH_TOKEN
if (AUTH_TOKEN) {
  console.log('✅ TWILIO_AUTH_TOKEN: Found');
  console.log(`   Value: ${AUTH_TOKEN.substring(0, 4)}...${AUTH_TOKEN.substring(AUTH_TOKEN.length - 4)}`);
  console.log(`   Length: ${AUTH_TOKEN.length} characters`);
  if (AUTH_TOKEN.length < 10) {
    console.log('   ⚠️  WARNING: Auth Token seems too short');
  }
} else {
  console.log('❌ TWILIO_AUTH_TOKEN: NOT FOUND');
  console.log('   Add to .env: TWILIO_AUTH_TOKEN=your_auth_token_here');
}

console.log('');

// Check WHATSAPP_NUMBER
if (WHATSAPP_NUMBER) {
  console.log('✅ TWILIO_WHATSAPP_NUMBER: Found');
  console.log(`   Value: ${WHATSAPP_NUMBER}`);
} else {
  console.log('⚠️  TWILIO_WHATSAPP_NUMBER: Not set (using default)');
  console.log('   Default: whatsapp:+14155238886');
  console.log('   Add to .env: TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Final validation
if (ACCOUNT_SID && AUTH_TOKEN && ACCOUNT_SID.startsWith('AC') && AUTH_TOKEN.length > 0) {
  console.log('✅ All credentials are valid!');
  console.log('✅ Twilio client should initialize successfully');
  console.log('\n💡 If server still shows error:');
  console.log('   1. Make sure .env file is in Backend/ folder');
  console.log('   2. Restart server after adding credentials');
  console.log('   3. Check for typos in variable names');
} else {
  console.log('❌ Credentials are missing or invalid!');
  console.log('\n📝 Fix:');
  if (!ACCOUNT_SID) {
    console.log('   - Add TWILIO_ACCOUNT_SID to .env file');
  }
  if (!AUTH_TOKEN) {
    console.log('   - Add TWILIO_AUTH_TOKEN to .env file');
  }
  if (ACCOUNT_SID && !ACCOUNT_SID.startsWith('AC')) {
    console.log('   - Account SID must start with "AC"');
    console.log('   - Check if you copied the correct value');
  }
  console.log('\n📄 Example .env file:');
  console.log('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('   TWILIO_AUTH_TOKEN=your_auth_token_here');
  console.log('   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886');
}

console.log('');

