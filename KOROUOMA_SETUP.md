# 🏔️ Korouoma Canyon Tour - Setup Guide

## What is Korouoma?

**Korouoma Canyon Winter Adventure** is a spectacular full-day experience featuring:
- 🏔️ Frozen waterfalls up to 30 meters high
- ❄️ Stunning ice formations
- 🥾 Winter hiking through pristine wilderness
- 📸 Incredible photo opportunities

---

## Quick Setup (2 minutes)

### Step 1: Add Tour to Database

Go to **Supabase SQL Editor** and run this:

```sql
-- Add Korouoma Canyon tour
INSERT INTO tours (id, name, description, adult_price, child_price, max_capacity) 
VALUES (
    6, 
    'Korouoma Canyon Winter Adventure', 
    'Explore the breathtaking frozen waterfalls and stunning ice formations of Korouoma Canyon on this full-day winter hiking adventure through pristine Arctic wilderness',
    149.00, 
    119.00, 
    8
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity;

-- Add available dates (Nov 1, 2025 - Apr 30, 2026)
DO $$
DECLARE
  korouoma_tour_id BIGINT := 6;
  tour_date DATE := '2025-11-01'::DATE;
  end_date DATE := '2026-04-30'::DATE;
BEGIN
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (korouoma_tour_id, tour_date, 8)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;

SELECT '✅ Korouoma tour added!' as result;
```

### Step 2: Verify

After running the SQL, refresh your website and:
1. Go to **Daytime Experiences** page
2. You should see **3 experiences** including Korouoma
3. Click on **Korouoma Canyon Adventure**
4. The booking form should work!

---

## Tour Details

- **Tour ID:** 6
- **Name:** Korouoma Canyon Winter Adventure
- **Price:** €149 adult / €119 child
- **Duration:** 6-7 hours (full day)
- **Group Size:** Max 8 people
- **Season:** November 1 - April 30
- **Pickup Time:** 09:00
- **Return Time:** ~15:30

---

## What's Included

✅ Hotel pickup and drop-off from Rovaniemi  
✅ Professional guide with Korouoma expertise  
✅ All hiking equipment (snowshoes, poles)  
✅ Warm winter clothing if needed  
✅ Hot drinks and Lappish snacks  
✅ Safety equipment  
✅ Photography assistance  

---

## Photos Used

- Hero slideshow: `/korouoma1.jpg`, `/korouoma2.jpg`
- Gallery: Both Korouoma photos

---

## Where It Appears

1. **Daytime Experiences** page - as 3rd option
2. **Direct URL:** https://royalnordic.fi/korouoma-canyon
3. **Booking form** integrated with tour ID 6

---

## Done!

Once you run the SQL, the Korouoma tour will be fully functional and bookable! 🎉

