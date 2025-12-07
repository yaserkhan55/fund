# How to Test WhatsApp Notification

## Step 1: Start the Server

Open a terminal in the `Backend` folder and run:

```bash
node sendWhatsApp.js
```

You should see:
```
🚀 WhatsApp Notification Sender running on port 3001
📱 Endpoint: http://localhost:3001/notify
```

## Step 2: Test It (Choose One Method)

### Method 1: Using the HTML File (Easiest)

1. Open `Backend/index.html` in your web browser
2. Click the "Send WhatsApp Notification" button
3. Check the result message

**Success looks like:**
- ✅ Green success message: "WhatsApp notification sent successfully!"
- Check your WhatsApp (number: 917058733358) for the message

**Error looks like:**
- ❌ Red error message with details

### Method 2: Using Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Run this code:

```javascript
fetch('http://localhost:3001/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Method 3: Using PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/notify" -Method POST -ContentType "application/json"
```

### Method 4: Using Postman or Thunder Client

- **URL:** `http://localhost:3001/notify`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:** (empty or any JSON)

## Step 3: Check the Results

### ✅ SUCCESS Response:
```json
{
  "success": true,
  "message": "WhatsApp notification sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [...],
    "messages": [...]
  }
}
```

**What to check:**
- ✅ Server console shows: "WhatsApp message sent successfully"
- ✅ Your WhatsApp (917058733358) receives the message
- ✅ Response shows `success: true`

### ❌ ERROR Response Examples:

**Invalid Token:**
```json
{
  "success": false,
  "error": "Failed to send WhatsApp message",
  "details": {
    "error": {
      "message": "Invalid OAuth access token.",
      "type": "OAuthException"
    }
  }
}
```

**Wrong Phone Number:**
```json
{
  "success": false,
  "error": "Failed to send WhatsApp message",
  "details": {
    "error": {
      "message": "Invalid parameter",
      "type": "OAuthException"
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Solution:** Make sure the server is running (`node sendWhatsApp.js`)

### Issue 2: "Invalid OAuth access token"
**Solution:** 
- Check if your token is correct
- Token might be expired (generate a new one)
- Make sure token has WhatsApp permissions

### Issue 3: "Network Error" in browser
**Solution:** 
- Make sure server is running on port 3001
- Check if firewall is blocking the connection
- Try accessing `http://localhost:3001/` first to verify server is up

### Issue 4: Message not received on WhatsApp
**Solution:**
- Verify recipient number is correct (917058733358)
- Check if the number is registered with WhatsApp Business API
- Wait a few seconds (messages can be delayed)

## Quick Health Check

Test if server is running:
```
http://localhost:3001/
```

Should return:
```json
{
  "success": true,
  "message": "WhatsApp Notification Sender is running",
  "endpoint": "POST /notify"
}
```

