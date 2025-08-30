# 🚀 Royal Nordic Supabase Migration Guide

## Complete Migration from Express.js to Supabase

### ✨ What You Get:

1. **🗄️ PostgreSQL Database** - Scalable, reliable database
2. **🔐 Built-in Authentication** - Secure user management
3. **📡 Real-time Subscriptions** - Live updates
4. **🌐 Auto-generated APIs** - No backend code needed
5. **🔒 Row Level Security** - Fine-grained permissions
6. **📊 Dashboard** - Visual database management

---

## 🛠️ Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name:** `royal-nordic`
   - **Database Password:** Generate a secure password
   - **Region:** Choose closest to your users (e.g., Europe West)
5. Click "Create new project"

### 2. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

### 3. Set Environment Variables

Create a `.env` file in your project root:

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install Supabase CLI (Optional)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

### 5. Run Database Migration

```bash
# Apply the migration
supabase db push

# Or manually run the SQL in Supabase Dashboard:
# Go to SQL Editor and paste the contents of supabase/migrations/001_initial_schema.sql
```

---

## 🔄 Migration Benefits

### Before (Express.js):
- ❌ Manual server setup
- ❌ SQLite database (file-based)
- ❌ Manual API endpoints
- ❌ Custom authentication
- ❌ Self-hosted

### After (Supabase):
- ✅ Auto-generated APIs
- ✅ PostgreSQL database
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Managed hosting

---

## 📱 Updated Admin Panel

### New Features:
- **Real-time updates** - See bookings as they happen
- **Better security** - Row Level Security policies
- **Mobile optimized** - Works great on phones
- **No server maintenance** - Fully managed

### Access:
- **Development:** `http://localhost:3000/admin`
- **Production:** `https://royalnordic.fi/admin`

---

## 🔐 Security Features

### Row Level Security (RLS):
```sql
-- Only admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );
```

### API Security:
- **CORS protection** - Configured for your domain
- **Rate limiting** - Built-in protection
- **JWT tokens** - Secure authentication

---

## 🗄️ Database Schema

### Tables Created:
1. **`tours`** - Tour information and pricing
2. **`tour_dates`** - Daily availability and slots
3. **`bookings`** - Customer bookings and payments
4. **`admin_users`** - Admin authentication

### Relationships:
- Tours → Tour Dates (1:many)
- Tour Dates → Bookings (1:many)
- Tours → Bookings (1:many)

---

## 🚀 Deployment

### Frontend Deployment:
1. **Vercel** (Recommended):
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**:
   ```bash
   npm run build
   # Upload dist folder to Netlify
   ```

3. **GitHub Pages**:
   ```bash
   npm run build
   # Push to gh-pages branch
   ```

### Environment Variables in Production:
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting platform
- Never commit `.env` files to git

---

## 📊 Monitoring & Analytics

### Supabase Dashboard:
- **Database** - View tables, run queries
- **Authentication** - Manage users
- **API** - Monitor requests
- **Logs** - View system logs

### Real-time Features:
```javascript
// Subscribe to booking changes
const subscription = supabase
  .from('bookings')
  .on('INSERT', payload => {
    console.log('New booking:', payload.new)
  })
  .subscribe()
```

---

## 🔄 API Migration

### Old Express.js Endpoints:
```javascript
// GET /api/availability/:tourId
// POST /api/bookings
// GET /api/admin/bookings
```

### New Supabase Functions:
```javascript
// All handled by Supabase client
import { getTourAvailability, createBooking } from '../lib/api'
```

---

## 💰 Cost Comparison

### Express.js Hosting:
- **Heroku:** $7-25/month
- **DigitalOcean:** $5-12/month
- **AWS:** $10-50/month

### Supabase:
- **Free Tier:** $0/month (up to 500MB, 50,000 requests)
- **Pro:** $25/month (8GB, 2M requests)
- **Team:** $599/month (100GB, 100M requests)

---

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing environment variables"**
   - Check `.env` file exists
   - Verify variable names start with `VITE_`

2. **"Database connection failed"**
   - Check Supabase project is active
   - Verify API keys are correct

3. **"RLS policy violation"**
   - Check Row Level Security policies
   - Verify user authentication

4. **"CORS error"**
   - Add your domain to Supabase CORS settings
   - Check API URL is correct

---

## 📞 Support

### Resources:
1. **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
2. **Discord Community:** [supabase.com/discord](https://supabase.com/discord)
3. **GitHub Issues:** [github.com/supabase/supabase](https://github.com/supabase/supabase)

### Migration Help:
- Check the `supabase/migrations/` folder for SQL files
- Review `src/lib/api.ts` for API functions
- Test with the updated `BookingForm` component

---

## 🎯 Next Steps

1. **Test the migration** - Try booking a tour
2. **Set up admin user** - Create your admin account
3. **Configure Stripe** - Add payment processing
4. **Deploy to production** - Go live with royalnordic.fi
5. **Monitor performance** - Use Supabase dashboard

---

**🎉 Migration Complete!** Your Royal Nordic booking system is now powered by Supabase with better scalability, security, and ease of maintenance.
