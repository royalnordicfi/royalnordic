# 📝 How to Add New Testimonials

## 📍 **Location:**
`/src/components/Reviews.tsx`

## 🔧 **How to Add:**

### **Step 1: Find the reviews array**
Open `src/components/Reviews.tsx` and find the `reviews` array (around line 15).

### **Step 2: Add your new review**
Add a new review object with this structure:

```typescript
{
  id: 8, // Next number in sequence
  name: "Customer Name",
  rating: 5, // 1-5 stars
  review: "Your testimonial text here...",
  location: "City, Country" or "Verified booking",
  date: "Month Day, Year" // Format: "March 15, 2025"
}
```

### **Step 3: Example**

```typescript
{
  id: 8,
  name: "Sarah Johnson",
  rating: 5,
  review: "Absolutely incredible experience! The Northern Lights tour exceeded all our expectations. Our guide was knowledgeable and made sure we had the best viewing spots. Highly recommend!",
  location: "Verified booking",
  date: "March 20, 2025"
}
```

## ✅ **Current Reviews:**
- Currently have **7 reviews**
- Next ID should be **8**

## 💡 **Tips:**
- **Rating:** Use 1-5 (5 = best)
- **Location:** Use "Verified booking" for verified customers, or city/country
- **Date:** Use format like "March 20, 2025"
- **Review Text:** Can be multiple sentences, as long as you want

## 📧 **When You Send Testimonials:**
Just send them like this:
- Name
- Rating (1-5)
- Review text
- Location (optional)
- Date (optional)

I'll format and add them! 🚀

