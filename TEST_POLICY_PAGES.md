# ✅ How to Test Policy Pages Before Razorpay Submission

Follow these steps to verify all policy pages are working correctly before submitting to Razorpay.

---

## 🧪 **Method 1: Test Locally (Development)**

### Step 1: Start Frontend Development Server
```bash
cd Frontend
npm run dev
```

### Step 2: Check the URLs
Once the server starts, you'll see something like:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Test Each Page in Browser
Open your browser and visit these URLs:

1. **Shipping Policy:**
   ```
   http://localhost:5173/shipping-policy
   ```

2. **Terms and Conditions:**
   ```
   http://localhost:5173/terms-and-conditions
   ```

3. **Refund Policy:**
   ```
   http://localhost:5173/refund-policy
   ```

### Step 4: Verify Each Page
For each page, check:
- ✅ Page loads without errors
- ✅ Title is visible and correct
- ✅ "Last Updated" date is shown
- ✅ Content is readable and properly formatted
- ✅ No console errors (press F12 → Console tab)
- ✅ Page is responsive (try resizing browser window)

---

## 🌐 **Method 2: Test on Deployed Frontend (Production)**

### Step 1: Deploy Your Frontend
If not already deployed, deploy your frontend to Vercel/Netlify/etc.

### Step 2: Get Your Frontend URL
Your deployed frontend URL will be something like:
- `https://fund-liart.vercel.app` (Vercel)
- `https://your-domain.com` (Custom domain)

### Step 3: Test Each Page
Visit these URLs in your browser:

1. **Shipping Policy:**
   ```
   https://YOUR_FRONTEND_URL/shipping-policy
   ```

2. **Terms and Conditions:**
   ```
   https://YOUR_FRONTEND_URL/terms-and-conditions
   ```

3. **Refund Policy:**
   ```
   https://YOUR_FRONTEND_URL/refund-policy
   ```

### Step 4: Verify Accessibility
- ✅ Pages load correctly
- ✅ No 404 errors
- ✅ Content is visible
- ✅ Pages are accessible without login
- ✅ Mobile-friendly (test on phone or browser dev tools)

---

## 🔍 **Method 3: Quick Verification Checklist**

### Visual Check
- [ ] All 3 pages have proper `<h1>` titles
- [ ] "Last Updated" date is visible on each page
- [ ] Content is readable and well-formatted
- [ ] Pages match your website theme/design
- [ ] No broken links or missing images

### Technical Check
- [ ] Pages return HTTP 200 status (not 404 or 500)
- [ ] Pages load quickly (< 3 seconds)
- [ ] No JavaScript errors in browser console
- [ ] Pages work on mobile devices
- [ ] Pages are accessible (no authentication required)

### Content Check
- [ ] Shipping Policy mentions "no physical shipping" (for donation platform)
- [ ] Terms and Conditions include platform rules
- [ ] Refund Policy explains refund scenarios
- [ ] All content is relevant to crowdfunding/donation platform

---

## 🛠️ **Method 4: Test Backend Routes (Optional)**

### Test Backend Placeholder Routes
If you want to verify backend routes work:

```bash
# Test Shipping Policy
curl http://localhost:5000/shipping-policy

# Test Terms and Conditions
curl http://localhost:5000/terms-and-conditions

# Test Refund Policy
curl http://localhost:5000/refund-policy
```

Or visit in browser:
- `http://localhost:5000/shipping-policy`
- `http://localhost:5000/terms-and-conditions`
- `http://localhost:5000/refund-policy`

These should return simple HTML pages saying "Frontend handles this page".

---

## 📋 **Final Checklist Before Razorpay Submission**

Before pasting URLs into Razorpay:

- [ ] All 3 pages tested locally
- [ ] All 3 pages tested on deployed frontend
- [ ] URLs are correct (no typos)
- [ ] Pages are publicly accessible (no login required)
- [ ] Content is complete and professional
- [ ] No broken links or errors
- [ ] Pages work on mobile devices

---

## 🎯 **URLs to Copy for Razorpay**

Once verified, use these exact URLs (replace `YOUR_FRONTEND_URL`):

```
https://YOUR_FRONTEND_URL/shipping-policy
https://YOUR_FRONTEND_URL/terms-and-conditions
https://YOUR_FRONTEND_URL/refund-policy
```

**Example (if using Vercel):**
```
https://fund-liart.vercel.app/shipping-policy
https://fund-liart.vercel.app/terms-and-conditions
https://fund-liart.vercel.app/refund-policy
```

---

## 🚨 **Common Issues & Fixes**

### Issue: Page shows 404
- **Fix**: Check if route is added in `App.jsx`
- **Fix**: Verify frontend is deployed with latest code

### Issue: Page shows blank/white screen
- **Fix**: Check browser console for errors
- **Fix**: Verify component imports are correct

### Issue: Styling looks broken
- **Fix**: Check if CSS is loading correctly
- **Fix**: Verify inline styles are applied

### Issue: Backend route not working
- **Fix**: Check if backend server is running
- **Fix**: Verify routes are added in `server.js`

---

## ✅ **Ready to Submit?**

Once all checks pass:
1. Copy the exact URLs from your deployed frontend
2. Go to Razorpay Dashboard → Settings → Website Verification
3. Paste the 3 URLs
4. Submit for verification

**Good luck! 🎉**

