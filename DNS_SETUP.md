# DNS Setup for Fast Email Delivery - Royal Nordic

## 🚨 **Current Issue:**
Emails to `contact@royalnordic.fi` are arriving **minutes late** instead of instantly.

## ✅ **Solution:**
Proper DNS configuration for fast email delivery using Resend service.

---

## 🔧 **Required DNS Records**

### **1. MX Records (Mail Exchange)**
Add these to your domain provider's DNS settings:

```
Type: MX
Name: @ (or leave blank)
Value: mx1.resend.com
Priority: 10

Type: MX
Name: @ (or leave blank)
Value: mx2.resend.com
Priority: 20
```

### **2. SPF Record (Sender Policy Framework)**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:spf.resend.com ~all
```

### **3. DKIM Record (DomainKeys Identified Mail)**
```
Type: TXT
Name: resend._domainkey
Value: [Get this from your Resend dashboard]
```

### **4. DMARC Record (Domain-based Message Authentication)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@royalnordic.fi
```

---

## 📧 **Resend Domain Verification**

### **Step 1: Add Domain to Resend**
1. Go to [resend.com](https://resend.com)
2. Login to your account
3. Go to "Domains" → "Add Domain"
4. Enter: `royalnordic.fi`

### **Step 2: Get DKIM Record**
1. After adding domain, Resend will show you a DKIM record
2. Copy the exact TXT record value
3. Add it to your DNS as shown above

### **Step 3: Verify Domain**
1. Wait for DNS propagation (can take up to 24 hours)
2. Click "Verify" in Resend dashboard
3. Status should show "Verified"

---

## 🚀 **Expected Results After Setup:**

- **Email Delivery**: **Instant** (within seconds)
- **Spam Score**: **Low** (better inbox placement)
- **Reliability**: **99.9%** delivery rate
- **Professional**: Emails from `noreply@royalnordic.fi`

---

## 🔍 **Current DNS Check**

Run these commands to check your current setup:

```bash
# Check MX records
dig MX royalnordic.fi

# Check SPF record
dig TXT royalnordic.fi

# Check DKIM record
dig TXT resend._domainkey.royalnordic.fi

# Check DMARC record
dig TXT _dmarc.royalnordic.fi
```

---

## ⚠️ **Common Issues & Fixes:**

### **Issue 1: Emails still delayed**
- **Fix**: Ensure all DNS records are added correctly
- **Check**: Wait 24 hours for full propagation

### **Issue 2: Emails going to spam**
- **Fix**: Add proper SPF, DKIM, and DMARC records
- **Check**: Use [mail-tester.com](https://mail-tester.com) to test

### **Issue 3: Domain not verifying**
- **Fix**: Double-check DKIM record value
- **Check**: Ensure no extra spaces in DNS value

---

## 📞 **Need Help?**

If you're still experiencing delays after implementing these DNS records:

1. **Wait 24 hours** for DNS propagation
2. **Test with mail-tester.com**
3. **Check Resend dashboard** for verification status
4. **Contact your domain provider** if DNS changes aren't working

---

## 🎯 **Priority Actions:**

1. **HIGH**: Add MX records for Resend
2. **HIGH**: Add SPF record
3. **MEDIUM**: Add DKIM record
4. **MEDIUM**: Add DMARC record
5. **LOW**: Test email delivery

**Expected timeline**: 2-24 hours for full effect.
