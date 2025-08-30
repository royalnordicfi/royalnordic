# 🚀 Royal Nordic Backend Setup Guide

## Complete Booking System with Stripe Integration & Mobile Admin Panel

### ✨ What You Get:

1. **💳 Stripe Payment Processing** - Secure credit card payments
2. **📱 Mobile Admin Panel** - Manage bookings from your phone
3. **🗄️ Real-time Database** - Live availability tracking
4. **📧 Email Notifications** - Automatic booking confirmations
5. **🔐 Secure Authentication** - Protected admin access

---

## 🛠️ Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from the dashboard
3. Copy `config.example.js` to `config.js`
4. Fill in your Stripe keys:

```javascript
// config.js
module.exports = {
  stripe: {
    secretKey: 'sk_test_your_actual_stripe_secret_key',
    publishableKey: 'pk_test_your_actual_stripe_publishable_key'
  },
  // ... other config
};
```

### 3. Start the Backend Server
```bash
node server.js
```

The server will run on `http://localhost:3001`

---

## 📱 Mobile Admin Panel Setup

### First Time Setup:
1. Open `http://localhost:3001/admin` on your phone
2. You'll see the "Setup Admin" screen
3. Create your admin account:
   - Username: `admin` (or whatever you prefer)
   - Email: `your-email@royalnordic.fi`
   - Password: `secure-password-123`

### Daily Use:
1. Open `http://localhost:3001/admin` on your phone
2. Login with your credentials
3. View all bookings, update statuses, manage availability

---

## 🔄 How It Works

### 1. **Customer Books Tour:**
- Selects date and participants
- Enters contact information
- Pays with Stripe
- Gets confirmation email

### 2. **Real-time Updates:**
- Database automatically updates availability
- Admin panel shows live booking data
- No double-bookings possible

### 3. **Admin Management:**
- View all bookings from phone
- Update booking status (pending/confirmed/cancelled)
- See customer details and special requests
- Monitor daily/weekly statistics

---

## 🗄️ Database Structure

The system automatically creates these tables:

- **`tours`** - Tour information and pricing
- **`tour_dates`** - Daily availability and slots
- **`bookings`** - Customer bookings and payments
- **`admin_users`** - Admin authentication

---

## 🔐 Security Features

- **JWT Authentication** - Secure admin login
- **Password Hashing** - Encrypted passwords
- **CORS Protection** - Secure API access
- **Input Validation** - Prevents malicious data

---

## 📧 Email Setup (Optional)

To send confirmation emails:

1. **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate app password
   - Update `config.js` with your credentials

2. **Custom SMTP:**
   - Update email settings in `config.js`
   - Test email functionality

---

## 🚀 Production Deployment

### For Live Website:

1. **Hosting:** Deploy to Heroku, DigitalOcean, or AWS
2. **Database:** Use PostgreSQL or MySQL instead of SQLite
3. **Environment:** Set production environment variables
4. **SSL:** Enable HTTPS for secure payments
5. **Monitoring:** Add logging and error tracking

---

## 🆘 Troubleshooting

### Common Issues:

1. **"Port already in use"**
   - Change port in `config.js`
   - Or kill existing process: `lsof -ti:3001 | xargs kill`

2. **"Stripe error"**
   - Check your API keys in `config.js`
   - Ensure you're using test keys for development

3. **"Database error"**
   - Delete `bookings.db` file and restart
   - Check file permissions

4. **"Admin panel not loading"**
   - Ensure backend server is running
   - Check browser console for errors

---

## 📱 Mobile Admin Features

### Dashboard:
- **Total Bookings** - Overall count
- **Pending Bookings** - Need attention
- **Recent Activity** - Latest bookings

### Booking Management:
- **View Details** - Customer info, dates, requests
- **Update Status** - Pending → Confirmed → Cancelled
- **Contact Info** - Email, phone, special requests
- **Payment Status** - Stripe payment confirmation

---

## 💰 Stripe Integration

### Payment Flow:
1. Customer fills booking form
2. Stripe creates payment intent
3. Customer enters card details
4. Payment processed securely
5. Booking confirmed automatically
6. Confirmation email sent

### Test Cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

---

## 🔄 API Endpoints

### Public:
- `GET /api/availability/:tourId` - Check tour availability
- `POST /api/create-payment-intent` - Create Stripe payment
- `POST /api/bookings` - Create new booking

### Admin (Protected):
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/status` - Update booking status

---

## 📞 Support

Need help? Check:
1. **Console logs** in terminal
2. **Browser console** for frontend errors
3. **Network tab** for API issues
4. **Stripe dashboard** for payment problems

---

## 🎯 Next Steps

1. **Test the system** with sample bookings
2. **Customize the admin panel** to your needs
3. **Add more tours** to the database
4. **Integrate with your website** frontend
5. **Deploy to production** when ready

---

**🎉 You're all set!** Your Royal Nordic booking system is ready to handle real customers with secure payments and mobile management.

