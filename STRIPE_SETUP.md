# 💳 Stripe Integration Setup Guide

## Complete Payment Processing for Royal Nordic

### ✨ What You Get:

1. **Secure Payment Processing** - Stripe handles all payment security
2. **Automatic Booking Confirmation** - Payments trigger booking status updates
3. **Webhook Integration** - Real-time payment status updates
4. **Multiple Payment Methods** - Cards, Apple Pay, Google Pay, etc.
5. **Automatic Refunds** - Easy refund processing

---

## 🛠️ Setup Steps

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete your business verification
3. Get your API keys from the dashboard

### 2. Get Your Stripe Keys

In your Stripe Dashboard:
1. Go to **Developers** → **API keys**
2. Copy these keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Set Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

### 5. Set Supabase Environment Variables

In your Supabase Dashboard:
1. Go to **Settings** → **Edge Functions**
2. Add these environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 6. Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and add it to your environment variables

---

## 🔄 How the Payment Flow Works

### 1. **Customer Fills Booking Form:**
```
Customer → Selects date/participants → Enters contact info
```

### 2. **Create Payment Intent:**
```
Frontend → Supabase Edge Function → Stripe API
```

### 3. **Customer Pays:**
```
Stripe Checkout → Customer enters card details → Payment processed
```

### 4. **Webhook Updates Booking:**
```
Stripe → Webhook → Supabase Database → Booking status updated
```

### 5. **Confirmation:**
```
Customer → Redirected back → Booking confirmed
```

---

## 💰 Pricing Information

### Stripe Fees:
- **European cards:** 1.4% + €0.25 per transaction
- **International cards:** 2.9% + €0.25 per transaction
- **No monthly fees** - pay per transaction

### Example for Northern Lights Tour:
- **Tour price:** €179
- **Stripe fee:** €2.76 (1.4% + €0.25)
- **You receive:** €176.24

---

## 🔐 Security Features

### Built-in Security:
- **PCI Compliance** - Stripe handles all card data
- **3D Secure** - Automatic fraud protection
- **Tokenization** - Cards are never stored on your server
- **Webhook Verification** - Ensures webhooks are from Stripe

### Your Responsibilities:
- Keep API keys secure
- Use HTTPS in production
- Validate webhook signatures
- Handle failed payments gracefully

---

## 📱 Payment Methods Supported

### Automatic Support:
- **Credit/Debit Cards** - Visa, Mastercard, American Express
- **Digital Wallets** - Apple Pay, Google Pay
- **Local Payment Methods** - iDEAL, SEPA Direct Debit
- **Buy Now, Pay Later** - Klarna, Afterpay

### Configuration:
All payment methods are automatically enabled based on your customer's location and device.

---

## 🧪 Testing

### Test Cards:
```bash
# Successful payment
4242 4242 4242 4242

# Failed payment
4000 0000 0000 0002

# Requires authentication
4000 0025 0000 3155
```

### Test Mode:
- Use `pk_test_` and `sk_test_` keys for development
- Switch to `pk_live_` and `sk_live_` for production
- Test webhooks using Stripe CLI

---

## 🚀 Production Deployment

### 1. **Switch to Live Keys:**
```bash
# Update environment variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
```

### 2. **Update Webhook URL:**
```
https://royalnordic.fi/functions/v1/stripe-webhook
```

### 3. **Test Everything:**
- Make a test booking with real card
- Verify webhook receives events
- Check booking status updates

---

## 📊 Monitoring & Analytics

### Stripe Dashboard:
- **Payments** - View all transactions
- **Analytics** - Revenue, conversion rates
- **Disputes** - Handle chargebacks
- **Refunds** - Process refunds easily

### Your Admin Panel:
- **Booking Status** - See payment status
- **Revenue Tracking** - Monitor income
- **Failed Payments** - Handle issues

---

## 🆘 Troubleshooting

### Common Issues:

1. **"Payment failed"**
   - Check Stripe dashboard for error details
   - Verify card details are correct
   - Check if 3D Secure is required

2. **"Webhook not received"**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Test with Stripe CLI

3. **"Booking not updated"**
   - Check webhook function logs
   - Verify database permissions
   - Check payment intent ID matches

---

## 💡 Best Practices

### Security:
- Never log card details
- Use environment variables for keys
- Validate all webhook events
- Implement proper error handling

### User Experience:
- Show clear pricing breakdown
- Provide payment confirmation
- Send booking confirmation emails
- Handle failed payments gracefully

### Business:
- Set up automatic refunds
- Monitor for fraudulent activity
- Keep detailed payment records
- Plan for chargeback handling

---

## 📞 Support

### Resources:
1. **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)
2. **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
3. **Stripe Support:** Available in dashboard

### Testing Tools:
- **Stripe CLI:** Test webhooks locally
- **Stripe Test Cards:** Test different scenarios
- **Stripe Dashboard:** Monitor payments

---

## 🎯 Next Steps

1. **Set up Stripe account** and get API keys
2. **Deploy Edge Functions** to Supabase
3. **Configure webhooks** in Stripe dashboard
4. **Test the payment flow** with test cards
5. **Go live** with real payments

---

**🎉 Payment System Ready!** Your Royal Nordic booking system now has secure, professional payment processing with Stripe.
