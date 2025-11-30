# 🔐 Razorpay Website Verification - Step by Step

Now that your policy pages are working, follow these steps to submit them to Razorpay.

---

## 📋 **Step 1: Login to Razorpay Dashboard**

1. Go to: **https://dashboard.razorpay.com**
2. Login with your Razorpay account credentials
3. You'll see the Razorpay Dashboard

---

## 🔍 **Step 2: Navigate to Website Verification**

1. In the left sidebar, click on **"Settings"**
2. Scroll down or look for **"Website Verification"** or **"Website Details"** section
3. Click on **"Website Verification"** or **"Add Website"**

**Alternative Path:**
- Go to **"Account & Settings"** → **"Website Verification"**
- Or **"Settings"** → **"Website Details"** → **"Verify Website"**

---

## 📝 **Step 3: Fill in Website Verification Form**

You'll see a form with fields like:

### **Website URL:**
Enter your main website URL (frontend URL):
```
https://YOUR_FRONTEND_URL
```
**Example:** `https://fund-liart.vercel.app`

### **Policy Pages Section:**

You'll see 3 fields for policy pages:

#### **1. Shipping Policy URL:**
```
https://YOUR_FRONTEND_URL/shipping-policy
```

#### **2. Terms and Conditions URL:**
```
https://YOUR_FRONTEND_URL/terms-and-conditions
```

#### **3. Refund Policy URL:**
```
https://YOUR_FRONTEND_URL/refund-policy
```

---

## ✅ **Step 4: Copy Your Exact URLs**

Before pasting, make sure you have the correct URLs. Replace `YOUR_FRONTEND_URL` with your actual frontend domain.

**Example URLs (if your frontend is on Vercel):**
```
Main Website: https://fund-liart.vercel.app
Shipping Policy: https://fund-liart.vercel.app/shipping-policy
Terms and Conditions: https://fund-liart.vercel.app/terms-and-conditions
Refund Policy: https://fund-liart.vercel.app/refund-policy
```

**Important:**
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slashes (don't add `/` at the end)
- ✅ Copy exact URLs (no typos)
- ✅ Make sure URLs are publicly accessible

---

## 🚀 **Step 5: Submit for Verification**

1. Double-check all URLs are correct
2. Click **"Submit"** or **"Verify Website"** button
3. Razorpay will automatically verify the URLs

---

## ⏳ **Step 6: Wait for Verification**

- Razorpay bots will crawl your pages
- Verification usually takes **5-15 minutes**
- You'll receive an email notification when verification is complete
- Check the dashboard for verification status

---

## ✅ **Step 7: Verification Status**

After submission, you'll see one of these statuses:

### **✅ Verified (Success)**
- All pages are accessible
- Content is appropriate
- You can proceed with live payments

### **⚠️ Pending**
- Still being verified
- Wait a few more minutes

### **❌ Failed**
- Check the error message
- Common issues:
  - Pages not accessible (404 error)
  - Pages require login
  - Content doesn't match requirements
  - URLs are incorrect

---

## 🔧 **Troubleshooting Failed Verification**

If verification fails:

### **Issue: "Page not found (404)"**
- **Fix:** Check if URLs are correct
- **Fix:** Verify pages are deployed
- **Fix:** Test URLs in browser first

### **Issue: "Page requires authentication"**
- **Fix:** Make sure pages are publicly accessible
- **Fix:** Remove any login requirements from policy pages

### **Issue: "Content not found"**
- **Fix:** Verify pages have proper content
- **Fix:** Check if pages load correctly in browser

### **Issue: "Invalid URL format"**
- **Fix:** Use `https://` (not `http://`)
- **Fix:** Remove trailing slashes
- **Fix:** Check for typos

---

## 📞 **Need Help?**

- **Razorpay Support:** https://razorpay.com/support
- **Razorpay Docs:** https://razorpay.com/docs/payments/dashboard/website-verification/
- **Contact Support:** Use the support chat in Razorpay dashboard

---

## 🎯 **Quick Checklist Before Submission**

- [ ] All 3 policy pages are working
- [ ] URLs are correct (no typos)
- [ ] Pages are publicly accessible (no login)
- [ ] Pages have proper content
- [ ] Using `https://` (not `http://`)
- [ ] No trailing slashes in URLs
- [ ] Tested all URLs in browser

---

## ✅ **After Verification**

Once verified:
1. ✅ Your website is approved for Razorpay payments
2. ✅ You can process live payments
3. ✅ Your account is ready for production use

**Congratulations! 🎉**

