// Configuration file for Royal Nordic Backend
// Copy this to config.js and fill in your actual values

module.exports = {
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here'
  },

  // JWT Secret (change this to a secure random string)
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',

  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    // Production domain settings
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://royalnordic.fi', 'https://www.royalnordic.fi']
      : ['http://localhost:3000', 'http://localhost:3001']
  },

  // Database Configuration
  // For development: SQLite (current setup)
  // For production: PostgreSQL or MySQL
  database: {
    // Development (SQLite)
    type: process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite',
    // Production (PostgreSQL)
    url: process.env.DATABASE_URL || './bookings.db'
  },

  // Email Configuration (optional - for sending confirmation emails)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

