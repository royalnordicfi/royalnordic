import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting for admin routes
const adminAttempts = new Map();
app.use('/api/admin/*', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempts = adminAttempts.get(ip) || [];
  
  // Remove attempts older than 15 minutes
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
  
  if (recentAttempts.length >= 5) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  }
  
  adminAttempts.set(ip, recentAttempts);
  next();
});

// Database setup
// For production, replace SQLite with PostgreSQL:
// const { Pool } = require('pg');
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new sqlite3.Database('./bookings.db');

// Initialize database tables
db.serialize(() => {
  // Tours table
  db.run(`CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    adult_price REAL NOT NULL,
    child_price REAL NOT NULL,
    max_capacity INTEGER DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Dates table for availability
  db.run(`CREATE TABLE IF NOT EXISTS tour_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tour_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    available_slots INTEGER NOT NULL,
    total_booked INTEGER DEFAULT 0,
    FOREIGN KEY (tour_id) REFERENCES tours (id),
    UNIQUE(tour_id, date)
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tour_id INTEGER NOT NULL,
    tour_date_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    adults INTEGER NOT NULL,
    children INTEGER NOT NULL,
    total_price REAL NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending',
    special_requests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tours (id),
    FOREIGN KEY (tour_date_id) REFERENCES tour_dates (id)
  )`);

  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    secure_key_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default tour if none exists
  db.get("SELECT COUNT(*) as count FROM tours", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO tours (name, description, adult_price, child_price, max_capacity) 
               VALUES (?, ?, ?, ?, ?)`, 
        ['Northern Lights Tour', 'Guaranteed Northern Lights experience in Lapland', 179, 149, 8]
      );
      
      // Insert sample dates for Northern Lights Tour: September 15, 2025 - April 15, 2026
      const northernLightsStartDate = new Date('2025-09-15');
      const northernLightsEndDate = new Date('2026-04-15');
      
      for (let d = new Date(northernLightsStartDate); d <= northernLightsEndDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        db.run(`INSERT INTO tour_dates (tour_id, date, available_slots) VALUES (1, ?, 8)`, [dateStr]);
      }
      
      // Insert sample dates for Snowshoe Rentals: November 1, 2025 - April 15, 2026
      const snowshoeStartDate = new Date('2025-11-01');
      const snowshoeEndDate = new Date('2026-04-15');
      
      for (let d = new Date(snowshoeStartDate); d <= snowshoeEndDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        db.run(`INSERT INTO tour_dates (tour_id, date, available_slots) VALUES (2, ?, 6)`, [dateStr]);
      }
    }
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Get tour availability
app.get('/api/availability/:tourId', (req, res) => {
  const { tourId } = req.params;
  const { start_date, end_date } = req.query;

  let query = `
    SELECT td.date, td.available_slots, td.total_booked, 
           (td.available_slots - td.total_booked) as remaining_slots
    FROM tour_dates td
    WHERE td.tour_id = ?
  `;

  const params = [tourId];

  if (start_date && end_date) {
    query += ' AND td.date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' ORDER BY td.date';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create payment intent for Stripe
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  const {
    tour_id,
    tour_date_id,
    customer_name,
    customer_email,
    customer_phone,
    adults,
    children,
    total_price,
    stripe_payment_intent_id,
    special_requests
  } = req.body;

  try {
    // Check availability
    db.get(
      'SELECT available_slots, total_booked FROM tour_dates WHERE id = ?',
      [tour_date_id],
      (err, dateRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!dateRow) {
          return res.status(404).json({ error: 'Date not found' });
        }

        const remainingSlots = dateRow.available_slots - dateRow.total_booked;
        const requestedSlots = adults + children;

        if (requestedSlots > remainingSlots) {
          return res.status(400).json({ 
            error: `Only ${remainingSlots} slots available` 
          });
        }

        // Create booking
        db.run(`
          INSERT INTO bookings (
            tour_id, tour_date_id, customer_name, customer_email, customer_phone,
            adults, children, total_price, stripe_payment_intent_id, special_requests
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          tour_id, tour_date_id, customer_name, customer_email, customer_phone,
          adults, children, total_price, stripe_payment_intent_id, special_requests
        ], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const bookingId = this.lastID;

          // Update available slots
          db.run(
            'UPDATE tour_dates SET total_booked = total_booked + ? WHERE id = ?',
            [requestedSlots, tour_date_id]
          );

          // Send confirmation email
          sendConfirmationEmail(customer_email, customer_name, {
            bookingId,
            adults,
            children,
            total_price,
            tour_date_id
          });

          res.json({ 
            success: true, 
            booking_id: bookingId,
            message: 'Booking created successfully' 
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (admin)
app.get('/api/admin/bookings', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      b.id, b.customer_name, b.customer_email, b.customer_phone,
      b.adults, b.children, b.total_price, b.status, b.created_at,
      b.special_requests,
      t.name as tour_name,
      td.date as tour_date
    FROM bookings b
    JOIN tours t ON b.tour_id = t.id
    JOIN tour_dates td ON b.tour_date_id = td.id
    ORDER BY b.created_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update booking status (admin)
app.put('/api/admin/bookings/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE bookings SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Status updated' });
    }
  );
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password, secureKey } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // Track this login attempt
  const attempts = adminAttempts.get(ip) || [];
  attempts.push(Date.now());
  adminAttempts.set(ip, attempts);

  db.get(
    'SELECT * FROM admin_users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      const validSecureKey = await bcrypt.compare(secureKey, user.secure_key_hash);
      
      if (!validPassword || !validSecureKey) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, email: user.email } });
    }
  );
});

// Create admin user (run once to set up)
app.post('/api/admin/setup', (req, res) => {
  const { email, password, secureKey } = req.body;

  // Hash both password and secure key
  bcrypt.hash(password, 10, (err, passwordHash) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    bcrypt.hash(secureKey, 10, (err, secureKeyHash) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.run(
        'INSERT INTO admin_users (email, password_hash, secure_key_hash) VALUES (?, ?, ?)',
        [email, passwordHash, secureKeyHash],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: 'Secure admin account created' });
        }
      );
    });
  });
});

  // Email function
  async function sendConfirmationEmail(email, name, bookingDetails) {
    try {
      // Get tour details from database
      db.get(`
        SELECT t.name as tour_name, t.adult_price, t.child_price, td.date as tour_date
        FROM bookings b
        JOIN tours t ON b.tour_id = t.id
        JOIN tour_dates td ON b.tour_date_id = td.id
        WHERE b.id = ?
      `, [bookingDetails.bookingId], async (err, tourData) => {
        if (err) {
          console.error('Error fetching tour data:', err);
          return;
        }

        // Get Resend API key
        const resendApiKey = process.env.RESEND_API_KEY;
        
        if (!resendApiKey) {
          console.log('Resend API key missing, cannot send confirmation email');
          return;
        }

        // Calculate price breakdown
        const adultTotal = tourData.adult_price * bookingDetails.adults;
        const childTotal = tourData.child_price * bookingDetails.children;
        const totalPrice = adultTotal + childTotal;

        // Format date
        const tourDate = new Date(tourData.tour_date);
        const formattedDate = tourDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Send confirmation email
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Royal Nordic <onboarding@resend.dev>',
            to: [email],
            subject: `Booking Confirmation - ${tourData.tour_name} - Royal Nordic`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <!-- Header with Company Name -->
                <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
                  <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
                  <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
                </div>
                
                <!-- Main Content -->
                <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Booking Confirmed! 🎉</h1>
                  
                  <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                    Dear <strong>${name}</strong>,
                  </p>
                  
                  <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                    Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.
                  </p>
                  
                  <!-- Tour Details -->
                  <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                    <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Tour Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Tour:</strong> ${tourData.tour_name}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Adults:</strong> ${bookingDetails.adults}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Children:</strong> ${bookingDetails.children}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Booking ID:</strong> #${bookingDetails.bookingId}</p>
                        <p style="margin: 8px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Price Breakdown -->
                  <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                    <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Price Breakdown</h3>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; font-size: 14px;">
                      <div>
                        <p style="margin: 8px 0;">${bookingDetails.adults} × Adult (€${tourData.adult_price})</p>
                        <p style="margin: 8px 0;">${bookingDetails.children} × Child (€${tourData.child_price})</p>
                      </div>
                      <div style="text-align: right;">
                        <p style="margin: 8px 0;">€${adultTotal.toFixed(2)}</p>
                        <p style="margin: 8px 0;">€${childTotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                      <span>Total:</span>
                      <span>€${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
                    <h3 style="color: #92400e; margin-bottom: 15px; font-size: 18px;">📋 What to Expect</h3>
                    <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                      <li>Professional Northern Lights hunting experience</li>
                      <li>Expert local guides with years of experience</li>
                      <li>All necessary equipment provided</li>
                      <li>Hot drinks and snacks included</li>
                      <li>Professional photography assistance</li>
                      <li>Guaranteed Northern Lights or free return trip</li>
                    </ul>
                  </div>
                  
                  <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                    We'll send you detailed meeting instructions and what to bring 24 hours before your tour. If you have any questions, don't hesitate to contact us!
                  </p>
                  
                  <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                    Best regards,<br>
                    <strong>The Royal Nordic Team</strong>
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 30px 20px; background-color: #1f2937; color: white;">
                  <h3 style="margin-bottom: 20px; font-size: 18px;">Contact Information</h3>
                  <div style="display: inline-block; text-align: left;">
                    <p style="margin: 8px 0; font-size: 14px;">
                      📧 <a href="mailto:contact@royalnordic.fi" style="color: #10b981; text-decoration: none;">contact@royalnordic.fi</a>
                    </p>
                    <p style="margin: 8px 0; font-size: 14px;">
                      📞 <a href="tel:+3584578345138" style="color: #10b981; text-decoration: none;">+358 45 78345138</a>
                    </p>
                    <p style="margin: 8px 0; font-size: 14px;">
                      🌍 <a href="https://royalnordic.fi" style="color: #10b981; text-decoration: none;">royalnordic.fi</a>
                    </p>
                  </div>
                  <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                    Rovaniemi, Finnish Lapland
                  </p>
                </div>
              </div>
            `,
            text: `
Booking Confirmation - ${tourData.tour_name} - Royal Nordic

Dear ${name},

Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.

Tour Details:
- Tour: ${tourData.tour_name}
- Date: ${formattedDate}
- Adults: ${bookingDetails.adults}
- Children: ${bookingDetails.children}
- Booking ID: #${bookingDetails.bookingId}
- Status: Confirmed

Price Breakdown:
${bookingDetails.adults} × Adult (€${tourData.adult_price}): €${adultTotal.toFixed(2)}
${bookingDetails.children} × Child (€${tourData.child_price}): €${childTotal.toFixed(2)}
Total: €${totalPrice.toFixed(2)}

What to Expect:
- Professional Northern Lights hunting experience
- Expert local guides with years of experience
- All necessary equipment provided
- Hot drinks and snacks included
- Professional photography assistance
- Guaranteed Northern Lights or free return trip

We'll send you detailed meeting instructions and what to bring 24 hours before your tour. If you have any questions, don't hesitate to contact us!

Best regards,
The Royal Nordic Team

Contact Information:
📧 contact@royalnordic.fi
📞 +358 45 78345138
🌍 royalnordic.fi
Rovaniemi, Finnish Lapland
            `,
          }),
        });

        if (response.ok) {
          console.log('Booking confirmation email sent successfully to:', email);
        } else {
          console.error('Failed to send confirmation email:', response.status, response.statusText);
        }
      });
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }

// Direct email endpoint for Stripe payments
app.post('/api/send-stripe-confirmation', async (req, res) => {
  try {
    const { customerName, customerEmail, adults, children, totalPrice, tourDate, tourName } = req.body;
    
    // Send confirmation email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    
    console.log('Resend API Key loaded:', resendApiKey ? 'Yes' : 'No');
    console.log('API Key length:', resendApiKey ? resendApiKey.length : 0);
    console.log('About to send email to:', customerEmail);
    console.log('Using from address: noreply@royalnordic.fi');
    
    if (!resendApiKey) {
      return res.status(500).json({ error: 'Resend API key not configured' });
    }

    // Calculate price breakdown
    const adultPrice = 179;
    const childPrice = 149;
    const adultTotal = adultPrice * adults;
    const childTotal = childPrice * children;

    // Send confirmation email to customer
    const customerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: [customerEmail],
        subject: `Booking Confirmation - ${tourName} - Royal Nordic`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header with Company Name -->
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
            </div>
            
            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Booking Confirmed! 🎉</h1>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                Dear <strong>${customerName}</strong>,
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.
              </p>
              
              <!-- Tour Details -->
              <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Tour Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Tour:</strong> ${tourName}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${tourDate}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Adults:</strong> ${adults}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Children:</strong> ${children}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
                  </div>
                </div>
              </div>
              
              <!-- Price Breakdown -->
              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Price Breakdown</h3>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; font-size: 14px;">
                  <div>
                    <p style="margin: 8px 0;">${adults} × Adult (€${adultPrice})</p>
                    <p style="margin: 8px 0;">${children} × Child (€${childPrice})</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 8px 0;">€${adultTotal.toFixed(2)}</p>
                    <p style="margin: 8px 0;">€${childTotal.toFixed(2)}</p>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                  <span>Total:</span>
                  <span>€${totalPrice}</span>
                </div>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
                <h3 style="color: #92400e; margin-bottom: 15px; font-size: 18px;">📋 What to Expect</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>Professional Northern Lights hunting experience</li>
                  <li>Expert local guides with years of experience</li>
                  <li>All necessary equipment provided</li>
                  <li>Hot drinks and snacks included</li>
                  <li>Professional photography assistance</li>
                  <li>Guaranteed Northern Lights or free return trip</li>
                </ul>
              </div>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                We'll send you detailed meeting instructions and what to bring 24 hours before your tour. If you have any questions, don't hesitate to contact us!
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Best regards,<br>
                <strong>The Royal Nordic Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 30px 20px; background-color: #1f2937; color: white;">
              <h3 style="margin-bottom: 20px; font-size: 18px;">Contact Information</h3>
              <div style="display: inline-block; text-align: left;">
                <p style="margin: 8px 0; font-size: 14px;">
                  📧 <a href="mailto:contact@royalnordic.fi" style="color: #10b981; text-decoration: none;">contact@royalnordic.fi</a>
                </p>
                <p style="margin: 8px 0; font-size: 14px;">
                  📞 <a href="tel:+3584578345138" style="color: #10b981; text-decoration: none;">+358 45 78345138</a>
                </p>
                <p style="margin: 8px 0; font-size: 14px;">
                  🌍 <a href="https://royalnordic.fi" style="color: #10b981; text-decoration: none;">royalnordic.fi</a>
                </p>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                Rovaniemi, Finnish Lapland
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (customerResponse.ok) {
      console.log('Booking confirmation email sent successfully to:', customerEmail);
    } else {
      const errorText = await customerResponse.text();
      console.error('Failed to send confirmation email:', customerResponse.status, customerResponse.statusText);
      console.error('Error details:', errorText);
    }

    // Send notification email to business
    const businessResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: ['royalnordicfi@gmail.com'],
        subject: `New Booking Confirmation - ${customerName} - Royal Nordic`,
        html: `
          <h2>New Booking Confirmation</h2>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Adults:</strong> ${adults}</p>
          <p><strong>Children:</strong> ${children}</p>
          <p><strong>Total Price:</strong> €${totalPrice}</p>
          <p><strong>Tour Date:</strong> ${tourDate}</p>
          <hr>
          <p><em>This booking was confirmed through Stripe payment.</em></p>
        `,
      }),
    });

    if (businessResponse.ok) {
      console.log('Business notification email sent successfully');
    } else {
      console.error('Failed to send business notification:', businessResponse.status, businessResponse.statusText);
    }

    res.json({ success: true, message: 'Confirmation emails sent' });
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    res.status(500).json({ error: 'Failed to send confirmation emails' });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    console.log('Testing email with API key:', resendApiKey ? 'Present' : 'Missing');
    
    if (!resendApiKey) {
      return res.status(500).json({ error: 'No API key' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: ['mirov.vesterinen@gmail.com'],
        subject: 'Test Email - Royal Nordic',
        html: '<h1>Test Email</h1><p>This is a test email from Royal Nordic.</p>',
      }),
    });

    console.log('Resend response status:', response.status);
    console.log('Resend response headers:', response.headers);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Email sent successfully:', result);
      res.json({ success: true, message: 'Test email sent', result });
    } else {
      const errorText = await response.text();
      console.error('Email failed:', response.status, errorText);
      res.status(response.status).json({ error: 'Email failed', details: errorText });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Mobile admin panel: http://localhost:${PORT}/admin`);
  console.log(`💳 Stripe integration ready`);
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

export default app;
