# 📧 Custom Email Server Setup Guide

## 🎯 Goal: Replace Gmail with Custom Email Server (No Rate Limits)

You want to use `noreply@mopgomts.com` instead of Gmail to avoid the 500 emails/day rate limit.

## ✅ What's Already Done

1. ✅ Updated `.env.local` with custom SMTP configuration
2. ✅ Tested the configuration (found DNS issue with `mail.mopgomts.com`)

## 🔧 Next Steps: Find Your Correct SMTP Settings

### Step 1: Determine Your SMTP Server

You need to find the correct SMTP server for `mopgomts.com`. Try these common patterns:

```bash
# Common SMTP server patterns:
SMTP_HOST=smtp.mopgomts.com     # Most common
SMTP_HOST=mail.mopgomts.com     # Alternative
SMTP_HOST=mx.mopgomts.com       # Mail exchange
SMTP_HOST=outgoing.mopgomts.com # Outgoing mail
```

### Step 2: Check with Your Email Provider

Contact your email hosting provider (whoever manages `mopgomts.com` emails) for:

1. **SMTP Server Address** (e.g., `smtp.mopgomts.com`)
2. **SMTP Port** (usually 587 for STARTTLS or 465 for SSL)
3. **Authentication Method** (username/password)
4. **Security Settings** (TLS/SSL requirements)

### Step 3: Common SMTP Configurations

#### Option A: STARTTLS (Port 587) - Most Common
```bash
SMTP_HOST=smtp.mopgomts.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@mopgomts.com
SMTP_PASS=your-email-password
```

#### Option B: SSL/TLS (Port 465)
```bash
SMTP_HOST=smtp.mopgomts.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@mopgomts.com
SMTP_PASS=your-email-password
```

#### Option C: Plain SMTP (Port 25) - Usually Blocked
```bash
SMTP_HOST=smtp.mopgomts.com
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=noreply@mopgomts.com
SMTP_PASS=your-email-password
```

## 🔍 How to Find Your SMTP Settings

### Method 1: Check Email Client Settings
If you use Outlook, Thunderbird, or Apple Mail with this email:
1. Open your email client
2. Go to Account Settings
3. Look for "Outgoing Mail Server" or "SMTP" settings

### Method 2: Contact Your Hosting Provider
If `mopgomts.com` is hosted by:
- **cPanel/WHM**: Check Email Accounts → Mail Client Configuration
- **Plesk**: Check Mail → Email Addresses → Settings
- **Office 365**: Use `smtp-mail.outlook.com:587`
- **Google Workspace**: Use `smtp.gmail.com:587`

### Method 3: DNS Lookup
Check MX records for `mopgomts.com`:
```bash
nslookup -type=MX mopgomts.com
```

## 🚀 Production Deployment (Render)

Once you have the correct SMTP settings, update your Render environment:

### Step 1: Go to Render Dashboard
1. Open your Render dashboard
2. Select your web service
3. Go to "Environment" tab

### Step 2: Update Environment Variables
```bash
# Replace with your actual SMTP settings
SMTP_HOST=smtp.mopgomts.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@mopgomts.com
SMTP_PASS=your-actual-password
EMAIL_FROM=noreply@mopgomts.com
EMAIL_FROM_NAME=Mopgom TS Registration System
EMAIL_REPLY_TO=noreply@mopgomts.com
ADMIN_EMAILS=admin@mopgomts.com
```

### Step 3: Deploy
1. Save the environment variables
2. Redeploy your service
3. Test email functionality

## 🎉 Benefits of Custom Email Server

✅ **No Rate Limits**: Unlike Gmail's 500 emails/day limit
✅ **Professional Appearance**: Emails from your domain
✅ **Better Deliverability**: Domain-matched sender
✅ **Full Control**: No third-party restrictions
✅ **Cost Effective**: Usually included with hosting

## 🧪 Testing Your Configuration

After updating the settings:

1. **Admin Panel Test**:
   - Go to Settings → Email Configuration
   - Click "Send Test Email"

2. **Registration Test**:
   - Create a test registration
   - Check if confirmation email arrives

3. **Message System Test**:
   - Send a message from admin panel
   - Verify email notifications work

## 🚨 Troubleshooting

### "Connection Refused" or "ENOTFOUND"
- ✅ Check SMTP server address is correct
- ✅ Verify DNS resolution works
- ✅ Try alternative SMTP server names

### "Authentication Failed"
- ✅ Verify username/password are correct
- ✅ Check if email account exists
- ✅ Ensure SMTP authentication is enabled

### "Connection Timeout"
- ✅ Try different ports (587, 465, 25)
- ✅ Check firewall settings
- ✅ Verify SMTP server is accessible

## 📞 Next Actions for You

1. **Find Correct SMTP Settings**: Contact your email provider or check existing email client settings
2. **Update `.env.local`**: Replace `mail.mopgomts.com` with correct SMTP server
3. **Test Locally**: Verify emails send successfully
4. **Update Render**: Deploy with correct production settings
5. **Verify Production**: Test email functionality in production

---

**🎯 Goal**: Once configured correctly, you'll have unlimited email sending capacity without Gmail's restrictions!