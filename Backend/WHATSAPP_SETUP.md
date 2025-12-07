# WhatsApp Notification Sender - Quick Setup

## Files Created
- `sendWhatsApp.js` - Backend Express server
- `index.html` - Frontend test page

## Quick Start

### 1. Update Access Token
Open `sendWhatsApp.js` and replace `"PASTE_MY_TOKEN_HERE"` with your actual WhatsApp Cloud API access token on line 10.

### 2. Install Dependencies (if needed)
```bash
cd Backend
npm install cors
```

### 3. Run the Server
```bash
node sendWhatsApp.js
```

The server will start on port 3001 (or the PORT environment variable if set).

### 4. Test the Frontend
Open `index.html` in your browser and click "Send WhatsApp Notification"

Or test via curl:
```bash
curl -X POST http://localhost:3001/notify
```

## Configuration
- **ACCESS_TOKEN**: Your WhatsApp Cloud API access token (line 10)
- **PHONE_NUMBER_ID**: 926454387213927 (already set)
- **RECIPIENT_NUMBER**: 917058733358 (already set)

## API Endpoint
- **POST** `/notify` - Sends WhatsApp notification

## Response Format
**Success:**
```json
{
  "success": true,
  "message": "WhatsApp notification sent successfully",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

