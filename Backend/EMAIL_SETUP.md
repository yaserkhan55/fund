# Email OTP Setup Guide

## Environment Variables Required

Add these to your `.env` file in the `Backend` directory:

### Option 1: Gmail (Recommended for Development)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use that password in `EMAIL_PASS`

### Option 2: Custom SMTP
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
EMAIL_FROM=your-email@yourdomain.com
```

## Features Implemented

✅ **Email OTP Sending**
- Beautiful HTML email template
- Plain text fallback
- Automatic OTP generation and expiration (10 minutes)

✅ **Skip OTP Option**
- Users can skip OTP verification for convenience
- Can verify email later from profile settings
- Backend supports `skipOTP: true` parameter

✅ **Professional Donation Icons**
- Replaced emoji hearts with SVG icons
- Consistent design across all donation buttons
- Professional plus icon for donations

✅ **Enhanced Donate Buttons**
- Shimmer effect on hover
- Smooth scale animations
- Gradient backgrounds
- Professional polish and effects

## Testing

If email is not configured, the OTP will be logged to console:
```
⚠️ Email not configured. OTP for user@example.com: 123456
```

In development mode, if email sending fails, the OTP is also returned in the API response (remove in production).

## Next Steps

1. Set up email credentials in `.env`
2. Test OTP sending
3. Remove `devOtp` from production responses
4. Consider using a service like SendGrid or Resend for production

