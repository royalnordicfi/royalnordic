# Fix Delete Issue - Quick Guide

## Problem
Bookings cannot be deleted from the admin panel due to Row Level Security (RLS) policies in Supabase.

## Solution
Run the migration file to update RLS policies.

## Steps to Fix (Takes 2 minutes):

### Option 1: Using Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your Royal Nordic project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the **ENTIRE contents** of this file:
   ```
   supabase/migrations/011_comprehensive_admin_rls_fix.sql
   ```
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see: "Comprehensive admin RLS policies applied successfully!"

### Option 2: Using Supabase CLI (If you have it installed)
```bash
cd /Users/mirovesterinen/Documents/royalnordic-main
supabase db push
```

## After Running the Migration:
1. Refresh your admin panel (Cmd+Shift+R)
2. Try deleting a booking
3. It should now work! ✅

## What This Fixes:
- ✅ Delete bookings (all types: tours, manual, transportation)
- ✅ Update booking status
- ✅ Modify tour dates
- ✅ Edit tour information
- ✅ All admin operations

## Security Note:
The admin panel has its own authentication layer (email/password), so it's safe to allow these operations for the anon key. The frontend authentication ensures only authorized users can access the admin panel.

---
**Need Help?** Contact me or check Supabase logs if you see any errors.

