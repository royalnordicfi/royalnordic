# 📱 Royal Nordic Admin Panel Setup Guide

## Complete Admin Dashboard with Email Notifications

### ✨ What You Get:

1. **📊 Real-time Dashboard** - Live booking statistics and revenue tracking
2. **🔍 Advanced Search** - Find bookings by customer, tour, or date
3. **📧 Email Notifications** - Instant alerts for new bookings
4. **📱 Mobile Optimized** - Works perfectly on phones and tablets
5. **🔐 Secure Access** - Protected admin routes
6. **📈 Business Insights** - Track performance and growth

---

## 🛠️ Setup Steps

### 1. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy send-email
```

### 2. Set Environment Variables

In your Supabase Dashboard → Settings → Edge Functions:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (choose one)
GMAIL_USER=royalnordicfi@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# OR for production (recommended)
RESEND_API_KEY=re_your_resend_api_key

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configure Email Service

#### Option A: Gmail (Development)
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Use the app password in `GMAIL_APP_PASSWORD`

#### Option B: Resend (Production - Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Set `RESEND_API_KEY` environment variable

#### Option C: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Set `SENDGRID_API_KEY` environment variable

### 4. Test the System

1. **Make a test booking** on your website
2. **Check email notifications** are sent to:
   - `royalnordicfi@gmail.com`
   - `contact@royalnordic.fi`
3. **Access admin panel** at `/admin`
4. **Verify booking appears** in the dashboard

---

## 📱 Admin Panel Features

### Dashboard Overview:
- **Total Bookings** - All-time count
- **Pending Bookings** - Need attention
- **Confirmed Bookings** - Revenue generating
- **Total Revenue** - Business performance

### Booking Management:
- **View Details** - Full customer and tour information
- **Update Status** - Confirm, cancel, or mark pending
- **Search & Filter** - Find specific bookings quickly
- **Real-time Updates** - See changes immediately

### Customer Information:
- **Full Name** - Customer's complete name
- **Email Address** - Primary contact method
- **Phone Number** - Alternative contact
- **Special Requests** - Any additional requirements

### Tour Details:
- **Tour Name** - Northern Lights, Snowshoe, etc.
- **Tour Date** - When the tour is scheduled
- **Participants** - Adults and children count
- **Total Price** - Revenue per booking

---

## 📧 Email Notification System

### When Notifications Are Sent:
1. **New Booking Created** - Customer submits form
2. **Payment Confirmed** - Stripe webhook received
3. **Payment Failed** - Customer payment declined

### Email Content Includes:
- **Booking ID** - Unique reference number
- **Customer Details** - Name, email, phone
- **Tour Information** - Name, date, participants
- **Pricing Breakdown** - Adults, children, total
- **Special Requests** - Any customer notes
- **Booking Time** - When booking was made

### Email Recipients:
- **Primary:** `royalnordicfi@gmail.com`
- **Secondary:** `contact@royalnordic.fi`

---

## 🔐 Security Features

### Admin Access Protection:
- **Route Protection** - `/admin` path secured
- **Data Validation** - All inputs sanitized
- **CORS Protection** - Cross-origin requests blocked
- **Rate Limiting** - Prevent abuse

### Data Security:
- **Row Level Security** - Database-level protection
- **JWT Authentication** - Secure token-based auth
- **Environment Variables** - Sensitive data protected
- **HTTPS Only** - Secure connections required

---

## 📊 Business Intelligence

### Key Metrics Tracked:
- **Booking Volume** - Daily, weekly, monthly trends
- **Revenue Growth** - Business performance
- **Tour Popularity** - Which tours sell best
- **Customer Behavior** - Peak booking times

### Performance Insights:
- **Conversion Rates** - Form submissions to bookings
- **Payment Success** - Stripe payment completion
- **Seasonal Trends** - Peak vs. off-peak periods
- **Customer Satisfaction** - Special requests patterns

---

## 🚀 Production Deployment

### 1. **Switch to Live Keys:**
```bash
# Update environment variables
STRIPE_SECRET_KEY=sk_live_your_live_key
RESEND_API_KEY=re_your_live_resend_key
```

### 2. **Update Email Settings:**
```bash
# Use professional email service
RESEND_API_KEY=re_your_resend_key
# Remove Gmail settings for production
```

### 3. **Set Up Monitoring:**
- **Email Delivery** - Track notification success
- **Admin Access** - Monitor login attempts
- **Booking Volume** - Set up alerts for spikes
- **Error Logging** - Track system issues

---

## 🆘 Troubleshooting

### Common Issues:

1. **"Email not received"**
   - Check environment variables are set
   - Verify email service API keys
   - Check Supabase function logs

2. **"Admin panel not loading"**
   - Ensure Supabase functions are deployed
   - Check browser console for errors
   - Verify database permissions

3. **"Bookings not appearing"**
   - Check database connection
   - Verify RLS policies are correct
   - Check API function logs

4. **"Payment webhooks failing"**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Test with Stripe CLI

---

## 💡 Best Practices

### Email Management:
- **Professional Templates** - Use consistent branding
- **Quick Response** - Reply to customers within 24 hours
- **Follow-up Emails** - Send confirmation and reminder emails
- **Spam Prevention** - Use professional email services

### Admin Workflow:
- **Daily Check** - Review new bookings every morning
- **Quick Actions** - Confirm/cancel bookings promptly
- **Customer Service** - Respond to special requests quickly
- **Data Backup** - Export important data regularly

### Business Operations:
- **Capacity Planning** - Monitor tour availability
- **Revenue Tracking** - Track daily/weekly income
- **Customer Insights** - Analyze booking patterns
- **Seasonal Preparation** - Plan for peak periods

---

## 📞 Support & Maintenance

### Regular Tasks:
1. **Monitor Email Delivery** - Ensure notifications work
2. **Update Tour Availability** - Add new dates as needed
3. **Review Customer Feedback** - Check special requests
4. **Backup Important Data** - Export booking information

### System Health:
- **Function Logs** - Check Supabase function performance
- **Database Performance** - Monitor query speeds
- **Email Delivery Rates** - Track notification success
- **Payment Processing** - Monitor Stripe webhooks

---

## 🎯 Next Steps

1. **Deploy Edge Functions** to Supabase
2. **Configure Email Service** (Gmail for dev, Resend for production)
3. **Test the Complete Flow** - booking → email → admin panel
4. **Set Up Monitoring** for production use
5. **Train Staff** on using the admin panel

---

**🎉 Admin System Ready!** Your Royal Nordic business now has a professional admin dashboard with instant email notifications for every booking.
