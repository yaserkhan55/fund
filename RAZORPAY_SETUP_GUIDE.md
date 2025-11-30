# 🚀 Razorpay Payment Gateway Setup Guide

Complete step-by-step guide to get Razorpay payment keys and configure them for your donation system.

---

## 📋 **Step 1: Create Razorpay Account**

### 1.1 Visit Razorpay Website
- Go to: **https://razorpay.com**
- Click on **"Sign Up"** or **"Get Started"** button (top right corner)

### 1.2 Sign Up Process
- Enter your **Business Email** (use a professional email)
- Enter your **Business Name** (e.g., "SEUMP Fundraising Platform")
- Create a **Password**
- Click **"Create Account"**

### 1.3 Verify Email
- Check your email inbox
- Click the verification link sent by Razorpay
- Complete email verification

### 1.4 Complete Business Details
- Fill in your business information:
  - **Business Type**: Select "Non-Profit" or "Individual" (depending on your setup)
  - **Business Name**: Your platform name
  - **Phone Number**: Your contact number
  - **Address**: Your business address
- Click **"Continue"**

---

## 🔑 **Step 2: Get API Keys**

### 2.1 Access Dashboard
- After login, you'll see the **Razorpay Dashboard**
- Look for **"Settings"** in the left sidebar menu
- Click on **"Settings"**

### 2.2 Navigate to API Keys
- In Settings, find **"API Keys"** section
- Click on **"API Keys"** tab

### 2.3 Generate Test Keys (For Testing First)
- You'll see two sections: **"Test Mode"** and **"Live Mode"**
- For testing, use **"Test Mode"** first
- Click **"Generate Test Key"** or **"Generate Key"** button
- You'll get:
  - **Key ID**: Starts with `rzp_test_...` (e.g., `rzp_test_abc123xyz`)
  - **Key Secret**: A long string (e.g., `secret_abc123xyz...`)
  
⚠️ **IMPORTANT**: Copy the **Key Secret** immediately - it's shown only once!

### 2.4 Generate Live Keys (For Production)
- After testing works, switch to **"Live Mode"**
- Click **"Generate Live Key"**
- Copy both **Key ID** (starts with `rzp_live_...`) and **Key Secret**
- Store them securely

---

## 🌐 **Step 3: Add Keys to Render (Your Backend)**

### 3.1 Login to Render
- Go to: **https://dashboard.render.com**
- Login to your account

### 3.2 Select Your Backend Service
- Find your backend service (the one running your Node.js server)
- Click on it to open the service dashboard

### 3.3 Go to Environment Tab
- In the left sidebar, click on **"Environment"**
- You'll see a list of existing environment variables

### 3.4 Add Razorpay Keys
- Click **"Add Environment Variable"** button
- Add the first variable:
  - **Key**: `RAZORPAY_KEY_ID`
  - **Value**: Paste your Key ID (e.g., `rzp_test_abc123xyz`)
  - Click **"Save Changes"**

- Add the second variable:
  - **Key**: `RAZORPAY_KEY_SECRET`
  - **Value**: Paste your Key Secret
  - Click **"Save Changes"**

### 3.5 Verify Variables
- You should now see both variables in the list:
  ```
  RAZORPAY_KEY_ID = rzp_test_abc123xyz
  RAZORPAY_KEY_SECRET = secret_abc123xyz...
  ```

### 3.6 Redeploy Service
- After adding variables, Render will automatically detect changes
- Click **"Manual Deploy"** → **"Deploy latest commit"** (or it may auto-deploy)
- Wait for deployment to complete (usually 2-5 minutes)

---

## ✅ **Step 4: Verify Configuration**

### 4.1 Check Backend Logs
- In Render dashboard, go to **"Logs"** tab
- Look for messages like:
  ```
  ✅ Razorpay initialized successfully
  [Razorpay] Order created successfully
  ```

### 4.2 Test Donation Flow
- Go to your website
- Click **"Donate Now"** on any campaign
- Enter an amount
- You should see the Razorpay payment popup (not an error)

### 4.3 Test Payment (Test Mode)
- Use Razorpay test card:
  - **Card Number**: `4111 1111 1111 1111`
  - **Expiry**: Any future date (e.g., `12/25`)
  - **CVV**: Any 3 digits (e.g., `123`)
  - **Name**: Any name
- Complete the payment
- Check if donation is recorded in your database

---

## 🔄 **Step 5: Switch to Live Mode (Production)**

### 5.1 When Ready for Real Payments
- After testing is complete, switch to **Live Keys**
- Go back to Razorpay Dashboard → Settings → API Keys
- Generate **Live Keys** (if not already done)
- Copy the **Live Key ID** and **Live Key Secret**

### 5.2 Update Render Environment
- Go to Render → Your Service → Environment
- Update `RAZORPAY_KEY_ID` with Live Key ID
- Update `RAZORPAY_KEY_SECRET` with Live Key Secret
- Save and redeploy

### 5.3 Complete KYC (Know Your Customer)
- Razorpay requires KYC verification for live payments
- Go to Razorpay Dashboard → **"Account & Settings"** → **"KYC"**
- Upload required documents:
  - Business registration documents
  - Bank account details
  - Identity proof
- Wait for verification (usually 1-3 business days)

---

## 📝 **Quick Reference**

### Test Mode Keys Format:
```
RAZORPAY_KEY_ID = rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxxxxxxxx
```

### Live Mode Keys Format:
```
RAZORPAY_KEY_ID = rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxxxxxxxx
```

### Test Card Details:
- **Card**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

---

## 🆘 **Troubleshooting**

### Issue: "Payment gateway is not configured"
- **Solution**: Check if environment variables are added correctly in Render
- Verify variable names are exactly: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Make sure you redeployed after adding variables

### Issue: "Invalid credentials"
- **Solution**: Verify you copied the keys correctly (no extra spaces)
- Check if you're using Test keys in test mode and Live keys in production

### Issue: Payment popup not showing
- **Solution**: Check browser console for errors
- Verify Razorpay script is loading correctly
- Check backend logs for initialization errors

---

## 📞 **Need Help?**

- **Razorpay Support**: https://razorpay.com/support
- **Razorpay Docs**: https://razorpay.com/docs/
- **Render Support**: https://render.com/docs

---

**✅ Once configured, your donation system will be fully functional!**

