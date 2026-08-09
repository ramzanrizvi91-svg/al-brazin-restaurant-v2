# 🍽️ Al-Brazin Smart Restaurant Ordering System — Complete Features Guide

## Overview

**Al-Brazin** is an enterprise-grade, AI-powered restaurant ordering and management platform built for multi-branch fine dining establishments. It combines a customer-facing mobile QR ordering experience with an advanced staff/admin dashboard, real-time kitchen management, and a loyalty rewards program—all secured with industry-standard authentication.

**Deployment:** Single-folder ZIP upload → automatic data persistence + real-time sync across all devices.

---

## 🎯 Core Features

### 1️⃣ Customer QR Ordering Experience (Dine-In)

**Path:** `Customer device → scan QR code → branch & table detected automatically`

#### Menu Browsing & Selection
- 📱 Beautiful, responsive mobile UI (optimized for phones at the table)
- 🌍 Multi-language support (English, العربية, اردو)
- 🔍 Smart search & category filtering (Starters, Mains, Desserts, Drinks)
- ⭐ Item ratings, descriptions, ingredients, calorie counts, allergen warnings
- 🌶️ Visual indicators (spicy, vegetarian, popular items, in-stock status)
- 📸 High-quality item photos for every menu choice

#### AI Waiter Chatbot (Powered by Google Gemini)
- 💬 Conversational natural language interface — customers can describe what they want
- 🔄 Multi-turn conversation memory — remembers choices within a session
- 🛒 Smart cart management via chat commands:
  - "Add 2 Wagyu burgers and a mojito" → parsed automatically into cart
  - "Remove the fries" → instant cart modification
  - "What's in the ribeye?" → detailed item info fetched from backend
- 🎤 Voice input support (with audio feedback chimes)
- 🌐 Language detection — responds in customer's chosen language
- 📋 Review analysis — uses AI to extract themes from guest feedback
- 🎁 Loyalty prompt integration — AI mentions earned points after order placement

#### Shopping Cart & Checkout
- 🛍️ Real-time cart display with item count, prices, running total
- ➕➖ Quantity adjustment (+ / - buttons per item)
- 💳 **Multiple payment methods** (Apple Pay simulation, Mada, Credit Card, Counter/Cash)
- 📝 Special instructions field (dietary notes, allergies, preparation requests)
- 🧾 VAT calculation (15% included in displayed total)
- 💰 **Loyalty discount preview** — before confirming, customers see how many points they'll redeem

### 2️⃣ Loyalty Rewards Program (Points + Tiers)

**Core Mechanics:**
- **Earning:** 1 point per 1 SAR spent (multiplied by tier bonus)
- **Redemption:** 10 points = 1 SAR discount on next order
- **Tiers:** Bronze (0-499 pts) → Silver (500-1999 pts) → Gold (2000+ pts)
- **Multipliers:** Bronze 1.0x | Silver 1.1x | Gold 1.25x
- **Identification:** Phone number (no account creation needed)

#### Checkout Integration
- 📱 Enter/verify phone number to link to loyalty account
- 👀 Instant lookup shows current balance, tier, available points
- 💸 Toggle redemption checkbox to apply discount before payment
- 📊 Transaction history stored permanently (never expires)

#### Admin Loyalty Dashboard
- 👥 Full member directory (sorted by points, spending, or tier)
- 📈 Aggregate stats (total members, lifetime points distributed, revenue from loyalty)
- 🏆 Tier breakdown with earning multipliers
- 🔄 Refresh real-time data with one click

---

### 3️⃣ Kitchen Display System (KDS) — Real-Time Order Management

**Path:** `Kitchen staff access → Orders tab → live order queue`

#### Features
- 📥 **Pending Orders** display (newest at top, oldest below)
- 👨‍🍳 **Status workflow:** Pending → Cooking → Ready → Served
- 🔊 **Audio alerts** for new orders (optional toggle with speaker icon)
- 🔴 **Color-coded badges** by status (red=pending, orange=cooking, green=ready)
- ⏱️ **Order age indicator** — how long this order has been waiting
- 📍 **Table location** — which area/table (helps kitchen coordinate with servers)
- 📋 **Item breakdown** — quantity × item name (easy-to-read layout)
- 🔴→🟢 **One-tap status transitions** (click the order card to mark progress)
- 🔄 **Real-time Socket.IO updates** — no polling delay; kitchen sees new orders instantly
- 🔐 **Staff-only access** — requires login with branch-scoped credentials

#### Waiter Call Management
- 📞 Customers press "call waiter" button on their phone
- ✨ Alerts appear in KDS with table number & area
- ⏱️ Shows how long customer has been waiting for attention
- ✅ Staff mark call as "Addressed" when waiter reaches the table
- 🔔 Optional sound notifications for new waiter calls

---

### 4️⃣ Admin SaaS Control Portal

**Path:** `Staff/admin login → Admin Portal → 7 management tabs`

#### Tab 1: 📊 Interactive Analytics
- 📈 Revenue charts (by branch, by date range)
- 🏪 Top-selling items & categories
- 👥 Customer satisfaction scores (from reviews)
- 🔝 Branch performance comparison
- 📅 Date range picker for custom reports
- 💾 Downloadable reports (for investors, board meetings)

#### Tab 2: 🍴 Menu Manager
- ➕ Add new menu items (name, price, category, description, ingredients, calories, spice level, veg/vegan flag)
- ✏️ Edit existing items (bulk update prices, availability, descriptions)
- 🗑️ Delete items (with confirmation)
- 📤 **Upload Menu from PDF/Excel** (Gemini AI parses the document)
- 🔄 Reset to default menu (one-click restore from template)
- 🖼️ Image upload per item (stored as base64 in the system)
- ⭐ Mark items as popular/featured
- 🚫 Toggle availability on/off (e.g., ran out of wagyu)
- 🔗 Branch-specific menu assignments (customize per location)

#### Tab 3: 🔐 QR Code Generator & Setup
- 🏪 Select branch + table to generate QR
- 📊 View QR for print/display (branch, table, area auto-inserted in QR data)
- 💾 Download QR code as image (PNG)
- 📱 QR preview with sample ordering flow
- 🖨️ Print-ready high-resolution QR codes
- 🔗 Shareable QR URLs for outdoor seating, private events

#### Tab 4: 📍 Tables Management
- ➕ Add new tables (number, area, branch)
- ✏️ Edit table details
- 🗑️ Remove tables
- 📋 View all tables by branch
- 🔢 Bulk table setup for new branches

#### Tab 5: 👥 Users Management (Admin Only)
- ➕ Provision new staff or admin accounts
- 🔑 Set passwords securely (hashed with bcrypt, never plaintext)
- 👮 Assign roles:
  - **Admin:** Global SaaS control (all branches, menu, pricing, users)
  - **Staff:** Branch-scoped (KDS, cashier, table calls for their branch only)
- ✏️ Edit existing user credentials
- 🗑️ Revoke access (delete users, prevent re-login)
- 🔐 Staff cannot view other branches' orders
- 📜 Audit trail of who provisioned/modified each account

#### Tab 6: 🛡️ Security Center
- 🔑 Change any user's password (admin override)
- 🔐 Session validation (httpOnly cookies, JWT verification)
- ⚠️ Password strength guidance
- 📋 Active session management
- 🚨 Auto-logout on inactivity/session expiry

#### Tab 7: 🎁 Loyalty Rewards Dashboard
- 👥 Complete member directory (phone, tier, points, spending)
- 📊 Sort by: points balance | lifetime spending | tier
- 💰 Aggregate stats: total members, total points distributed, total revenue
- 🏆 Tier thresholds & multiplier display
- 🔄 Real-time loyalty data refresh

---

### 5️⃣ Security & Authentication

#### Backend Security
- 🔐 **Passwords:** bcryptjs hashing (10 rounds, salted)
- 🎫 **Sessions:** JWT (JSON Web Token) signed with secret key
- 🍪 **Cookies:** httpOnly flag (not accessible to JavaScript; prevents XSS)
- 🌍 **HTTPS Ready:** Secure cookie flag enabled in production (`NODE_ENV=production`)
- 🚪 **Role-Based Access Control (RBAC):** Every protected endpoint checks `req.user.role`
- 🔒 **Branch Scoping:** Staff users restricted to their assigned branch's orders only
- ✅ **Input Validation:** Phone numbers normalized, JSON payloads validated

#### Frontend Security
- ✋ **Stored Session:** localStorage + server verification via `/api/auth/me`
- ⏰ **Session Validation:** On app load, frontend validates cookie with server
- 🚪 **Auth Gates:** Components require session before rendering admin/staff views
- 🔄 **Logout Flow:** Clears httpOnly cookie + localStorage

#### No Hardcoded Secrets
- 🔑 **JWT_SECRET** must be set in `.env` or environment variables
- ⚠️ Default accounts' passwords are hashed (never plaintext in code)
- 📋 Server generates clear warning if secret is not set (sessions won't persist across restarts)

---

### 6️⃣ Data Persistence (JSON File Database)

**Why not a traditional SQL database?**
- ✅ **Dependency-free:** No native binaries, no external service needed
- ✅ **Deploy anywhere:** Plain Node.js host, serverless, VPS, all work
- ✅ **Survives restarts:** All data (orders, menu, users, loyalty) saved to `/data/*.json`
- ✅ **Atomic writes:** Temp file + rename prevents corruption on crash
- ✅ **Upgrade path:** Can swap backend for PostgreSQL/MySQL later without touching frontend

#### Persisted Collections
1. **menu.json** — All menu items (prices, descriptions, images, availability)
2. **orders.json** — Complete order history (ID, items, status, payment, loyalty info)
3. **tables.json** — Table configuration per branch
4. **users.json** — Staff & admin accounts (hashed passwords)
5. **loyalty_accounts.json** — Customer loyalty profiles (phone → points/tier)
6. **loyalty_transactions.json** — Earn/redeem history (audit trail)
7. **waiter_calls.json** — Active waiter assistance requests
8. **reviews.json** — Customer feedback with ratings

---

### 7️⃣ Real-Time Updates (WebSocket via Socket.io)

#### Use Cases
- 🍳 **KDS Staff:** See new orders instantly (no 4-second polling lag)
- 📞 **Cashier:** New waiter calls appear immediately
- 📱 **Customer Phone:** Order status changes appear in real-time
- 🔄 **Polling Fallback:** If Socket.io disconnects, fallback to fetch (20-second polls)

#### Broadcasted Events
1. `order:new` — Order placed, kitchen must start cooking
2. `order:updated` — Status changed (Ready, Served, etc.)
3. `waiterCall:new` — Customer needs assistance
4. `waiterCall:updated` — Waiter addressed the request

---

### 8️⃣ Multi-Language Support

#### Supported Languages
- 🇬🇧 **English** — Default, formal business tone
- 🇸🇦 **العربية (Arabic)** — RTL layout, formal business Arabic
- 🇵🇰 **اردو (Urdu)** — RTL layout, Hindustani-influenced phrasing

#### Localization Scope
- ✅ Customer ordering interface (menu, checkout, AI waiter)
- ✅ Waiter call alerts
- ✅ Order tracking display
- ✅ Loyalty points messaging
- ⏳ Admin panel (core English, can be extended)

#### Language Switching
- Customer selects preferred language via menu toggle (flag icons)
- AI waiter detects language from chat input, responds in-kind
- Session persists language choice in localStorage

---

### 9️⃣ AI Review Analysis

**Feature:** Gemini API auto-analyzes customer reviews

#### What It Does
- 📝 Extracts sentiment (positive, negative, neutral)
- 🏆 Identifies best dishes ("Wagyu was amazing")
- ⚠️ Flags pain points ("Long wait time")
- 📊 Generates satisfaction score (0-100)
- 🎯 Creates executive summary for admin

#### Use Case
Admin sees at a glance: Which items are loved, what UX hurts, overall brand perception

---

## 🚀 Deployment & Setup

### Prerequisites
- 📦 **Node.js** (v18+)
- 🔑 **Google Gemini API Key** (for AI features)
- 📁 **Plain file system** (for `/data` folder)

### Installation

1. **Upload the ZIP folder to your hosting platform** (any Node.js host)

2. **Set environment variables:**
   ```bash
   # .env file (or platform settings)
   GEMINI_API_KEY=your_actual_key_here
   JWT_SECRET=your-long-random-secret-here
   NODE_ENV=production  # for HTTPS-only cookies
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the server:**
   ```bash
   npm run dev        # development (with auto-reload)
   npm run build      # production build
   npm run start      # run production build
   ```

5. **Access:**
   - Customer QR: `http://localhost:3000/customer?branch=golden&table=5`
   - Admin Portal: `http://localhost:3000/admin` (login required)
   - Kitchen Display: `http://localhost:3000/dashboard` (login required)

### Default Credentials

| Username | Password | Role | Scope |
|----------|----------|------|-------|
| `admin` | `admin123` | Admin | All Branches (Global) |
| `golden` | `riyadh123` | Staff | Golden Riyadh Branch Only |
| `diamond` | `jeddah123` | Staff | Diamond Jeddah Branch Only |
| `prestigino` | `khobar123` | Staff | Al Khobar Branch Only |
| `mirage` | `dammam123` | Staff | Mirage Dammam Branch Only |
| `alrashid` | `rashid123` | Staff | Al Rashid Branch Only |

⚠️ **IMPORTANT:** Change all default passwords immediately after first login via the Admin → Users tab.

---

## 🎨 Design & Theming

### Color Palette
- **Primary:** Amber/Orange (`#F27D26`, `#FFA500`)
- **Background:** Deep black (`#050505`, `#111111`)
- **Neutral:** Grayscale for text/borders
- **Accents:** Green (success), Red (error/urgent), Blue (info)

### Responsive Design
- 📱 Mobile-first (tables, phones, large tablets)
- 🖥️ Optimized for staff tablets in kitchen
- 🎯 Desktop admin portal (wide analytics charts)

### Accessibility
- ⌨️ Keyboard navigation throughout
- 🔊 Audio alerts (Chime feedback)
- 🔤 Clear hierarchy (headings, emphasis)
- 🌙 Dark mode only (reduces eye strain in bright kitchens)

---

## 📊 API Reference

### Public Endpoints (No Auth Required)

```
GET  /api/menu                          # List all menu items
GET  /api/tables                        # List all tables
GET  /api/orders/by-table               # Filter orders by branch + table
POST /api/orders                        # Place new order
GET  /api/loyalty/:phone                # Lookup loyalty balance by phone
POST /api/reviews                       # Submit guest rating & review
```

### Protected Endpoints (Staff/Admin Login Required)

```
POST /api/auth/login                    # Authenticate user
GET  /api/auth/me                       # Verify current session
POST /api/auth/logout                   # End session

GET  /api/orders                        # List all orders (full)
GET  /api/waiter-calls                  # List waiter call history
PUT  /api/orders/:id/status             # Update order status
PUT  /api/waiter-calls/:id              # Mark waiter call addressed

POST /api/menu                          # Add menu item (admin)
PUT  /api/menu/:id                      # Edit menu item (admin)
DELETE /api/menu/:id                    # Remove menu item (admin)

GET  /api/users                         # List all staff (admin)
POST /api/users                         # Create new user (admin)
PUT  /api/users/:id                     # Edit user (admin)
DELETE /api/users/:id                   # Remove user (admin)

GET  /api/loyalty                       # Full loyalty program stats (admin)
GET  /api/analytics                     # Sales & performance analytics (admin)
```

---

## 🔧 Troubleshooting

### Issue: "API key should be set when using the Gemini API"
**Solution:** Set `GEMINI_API_KEY` in `.env` file. Restart server.

### Issue: "Sessions lost after server restart"
**Solution:** Set `JWT_SECRET` in `.env`. Otherwise, a random secret is generated each boot.

### Issue: "Orders not appearing in KDS"
**Solution:** Check browser console for fetch errors. Verify login is still active (cookie may have expired).

### Issue: "Socket.IO connection failed"
**Solution:** Ensure `NODE_ENV=production` is set if behind a proxy. Check CORS settings.

---

## 📈 Roadmap & Future Features

- ✅ Database persistence (implemented)
- ✅ Secure authentication (implemented)
- ✅ Real-time sync (implemented)
- ✅ Loyalty rewards (implemented)
- ⏳ Email order confirmations (SMS/Twilio integration)
- ⏳ Push notifications (PWA)
- ⏳ Staff shift scheduling
- ⏳ Inventory management (stock tracking)
- ⏳ Dynamic pricing (AI-based surge pricing)
- ⏳ PostgreSQL migration (upgrade path ready)

---

## 📝 License & Support

**Built for:** Al-Brazin Restaurant Group  
**Platform:** Node.js + React 19 + Tailwind CSS + Socket.io  
**Hosting:** Any Node.js compatible host (Cloud Run, Railway, Heroku, VPS, Docker)

For support, contact your system administrator or the development team.

---

**Last Updated:** August 2026  
**Version:** 2.0 (Enhanced with Auth, Loyalty, & Real-Time)
