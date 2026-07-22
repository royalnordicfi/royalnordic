# admin.royalnordic.fi — Operator console setup

The public site (`royalnordic.fi`) and the operator console share one Vercel project.
Hostname decides which UI loads:

| Host | UI |
| --- | --- |
| `royalnordic.fi` | Public website |
| `admin.royalnordic.fi` | Booking / availability admin (login required) |

Local preview of admin: `http://localhost:5173/?admin=1`

---

## 1. DNS (domain registrar)

Add for `royalnordic.fi`:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `admin` | `cname.vercel-dns.com` |

(If Vercel shows a different target after you add the domain, use that.)

---

## 2. Vercel

1. Project **royalnordic** → Settings → Domains  
2. Add `admin.royalnordic.fi`  
3. Wait until status is valid  

Deploy this branch after the domain is attached.

---

## 3. Supabase Auth user

1. Supabase Dashboard → Authentication → Users → Add user  
2. Use an allowlisted email, e.g. `contact@royalnordic.fi` or `admin@royalnordic.fi`  
3. Set a strong password  
4. Optional but recommended: User → App metadata:

```json
{ "role": "admin" }
```

5. Authentication → URL configuration  
   - Site URL can stay `https://royalnordic.fi`  
   - Add redirect URL: `https://admin.royalnordic.fi/**`

---

## 4. Apply database security (required)

In Supabase → SQL Editor, run the full contents of:

`supabase/migrations/015_secure_admin_rls.sql`

Until this runs, the anon key can still read bookings via the API even though the admin UI requires login.

---

## 5. Verify

1. `https://admin.royalnordic.fi` → login screen (not the marketing site)  
2. Sign in → bookings dashboard  
3. `https://royalnordic.fi/admin.html` → redirects to admin subdomain (no static password page)  
4. `https://royalnordic.fi/admin-panel` → redirects to admin subdomain  
5. Sign out works  

---

## Allowlist emails (migration default)

- `admin@royalnordic.fi`  
- `contact@royalnordic.fi`  
- `mirov.vesterinen@gmail.com`  

Add more with:

```sql
INSERT INTO admin_allowlist (email) VALUES ('you@example.com');
```
