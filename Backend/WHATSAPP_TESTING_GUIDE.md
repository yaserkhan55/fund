# WhatsApp Notification Testing Guide

## 🧪 How to Test WhatsApp Notifications

### Step 1: Start the Server

```bash
cd Backend
node sendWhatsApp.js
```

**Expected Output:**
```
🚀 WhatsApp Notification Sender running on port 3001
📱 Endpoint: http://localhost:3001/notify
```

### Step 2: Test Methods

#### ✅ Method 1: Using HTML File (Easiest)
1. Open `Backend/index.html` in browser
2. Click "Send WhatsApp Notification" button
3. Check result message

#### ✅ Method 2: Browser Console
1. Open browser (Chrome/Edge)
2. Press F12 → Console tab
3. Run:
```javascript
fetch('http://localhost:3001/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => {
  console.log(data);
  alert(data.success ? '✅ Success! Check WhatsApp' : '❌ Error: ' + data.error);
});
```

#### ✅ Method 3: PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/notify" -Method POST -ContentType "application/json"
```

#### ✅ Method 4: Postman/Thunder Client
- **URL:** `POST http://localhost:3001/notify`
- **Headers:** `Content-Type: application/json`
- **Body:** (empty)

### Step 3: Verify Success

#### ✅ SUCCESS Indicators:
1. **Server Console:**
   ```
   WhatsApp message sent successfully: { messaging_product: 'whatsapp', ... }
   ```

2. **API Response:**
   ```json
   {
     "success": true,
     "message": "WhatsApp notification sent successfully",
     "data": { ... }
   }
   ```

3. **WhatsApp Message:**
   - Check phone: **917058733358**
   - Should receive: "Hello! Your WhatsApp Notification from my website is working 🚀"

#### ❌ ERROR Indicators:

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
**Solution:** Regenerate token or check token permissions

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
**Solution:** Verify recipient number is registered with WhatsApp Business API

### Step 4: Health Check

Test if server is running:
```
GET http://localhost:3001/
```

Should return:
```json
{
  "success": true,
  "message": "WhatsApp Notification Sender is running",
  "endpoint": "POST /notify"
}
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect" | Server not running - start with `node sendWhatsApp.js` |
| "Invalid token" | Token expired/wrong - get new token from Meta |
| "Network error" | Check firewall, verify port 3001 is open |
| Message not received | Verify phone number, wait 10-30 seconds |
| CORS error | Server CORS is enabled, check browser console |

## 📱 Expected WhatsApp Message

When successful, recipient (917058733358) will receive:
```
Hello! Your WhatsApp Notification from my website is working 🚀
```

