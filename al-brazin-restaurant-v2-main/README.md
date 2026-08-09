# 🍽️ Al-Brazin Smart Restaurant Ordering System v2.0

**Enterprise AI-Powered QR Ordering + Kitchen Management + Loyalty Rewards**

An all-in-one platform for multi-branch fine dining restaurants featuring:
- 📱 Customer QR-based menu ordering with AI waiter chatbot
- 🍳 Real-time Kitchen Display System (KDS) with live order tracking
- 💳 Secure staff/admin authentication & role-based access control
- 🎁 Points-based loyalty rewards program with tier system
- 📊 Analytics dashboard, menu management, user provisioning
- 🔄 Real-time Socket.io sync across all devices
- 💾 JSON-based persistence (survives server restarts)
- 🌍 Multi-language support (English, العربية, اردو)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Google Gemini API Key** (for AI waiter & review analysis)
- **Plain file system** (no database setup required)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` file in the project root:
```bash
# .env.local
GEMINI_API_KEY=your_actual_gemini_key_here
JWT_SECRET=generate_a_long_random_string_here
NODE_ENV=development
```

To generate a JWT_SECRET:
```bash
openssl rand -hex 32
```

### 3. Run Development Server
```bash
npm run dev
```

The app will start at `http://localhost:3000`

### 4. Access the System

#### 👥 Customer Ordering (Dine-In via QR)
```
http://localhost:3000/customer?branch=golden&table=5
```
(Scan this URL as QR code at your restaurant tables)

#### 🔐 Admin Portal (SaaS Control)
```
http://localhost:3000/admin
```
Login with:
- Username: `admin`
- Password: `admin123`

#### 🍳 Kitchen Display System (KDS)
```
http://localhost:3000/dashboard
```
Login with any staff account (e.g., `golden` / `riyadh123`)

---

## 🔑 Default Staff Accounts

| Username | Password | Role | Branch | Purpose |
|----------|----------|------|--------|---------|
| `admin` | `admin123` | Admin | Global | SaaS control, all branches |
| `golden` | `riyadh123` | Staff | Golden Riyadh | KDS, cashier, this branch only |
| `diamond` | `jeddah123` | Staff | Diamond Jeddah | KDS, cashier, this branch only |
| `prestigino` | `khobar123` | Staff | Al Khobar | KDS, cashier, this branch only |
| `mirage` | `dammam123` | Staff | Mirage Dammam | KDS, cashier, this branch only |
| `alrashid` | `rashid123` | Staff | Al Rashid | KDS, cashier, this branch only |

⚠️ **SECURITY:** Change all default passwords immediately after first login.

---

## 📁 Project Structure

```
.
├── server.ts                 # Express backend + WebSocket + Gemini integration
├── src/
│   ├── App.tsx              # Main React component (routing, auth state)
│   ├── main.tsx             # React entry point
│   ├── types.ts             # TypeScript interfaces
│   ├── socket.ts            # Socket.io client singleton
│   ├── index.css            # Tailwind CSS + custom theme
│   ├── initialData.ts       # Default menu, branches, tables
│   └── components/
│       ├── LoginView.tsx            # Staff/admin login
│       ├── CustomerView.tsx         # QR ordering + AI waiter + checkout
│       ├── AdminView.tsx            # SaaS admin portal (7 tabs)
│       ├── DashboardView.tsx        # KDS + real-time order tracking
│       └── AudioAlert.ts            # Chime notifications
├── server/
│   ├── db.ts                # Collection class (JSON persistence)
│   ├── auth.ts              # bcrypt + JWT + session middleware
│   └── loyalty.ts           # Points + tier calculation
├── data/                    # Runtime data folder (created on first run)
│   ├── menu.json
│   ├── orders.json
│   ├── users.json
│   ├── loyalty_accounts.json
│   ├── loyalty_transactions.json
│   ├── tables.json
│   ├── waiter_calls.json
│   └── reviews.json
├── .env.example             # Copy to .env.local and fill in
├── package.json
├── tsconfig.json
├── vite.config.ts
└── FEATURES.md              # Detailed feature documentation
```

---

## 🎯 Core Features

### 1. Customer QR Ordering
- 📱 Scan table QR → automatic branch & table detection
- 🤖 AI waiter chatbot (English/Arabic/Urdu)
- 🛒 Smart cart management via natural language
- 💳 Multiple payment methods (Apple Pay, Mada, Credit Card, Counter)
- 🎁 Loyalty phone lookup + points redemption at checkout

### 2. Kitchen Display System (Real-Time)
- 📥 Live order queue (Pending → Cooking → Ready → Served)
- 🔔 Audio alerts for new orders & waiter calls
- ⏱️ Order age display (how long waiting)
- 🔄 WebSocket-powered instant updates (no polling)
- 🔐 Staff scoped by branch (can't see other branches' orders)

### 3. Loyalty Rewards
- 💰 Earn 1 point per 1 SAR spent
- 🏆 Tier system (Bronze 1.0x → Silver 1.1x → Gold 1.25x multiplier)
- 🎁 Redeem 10 points for 1 SAR off future orders
- 📱 Phone-based identification (no account signup needed)
- 📊 Admin dashboard with member directory & tier breakdown

### 4. Admin SaaS Portal (7 Tabs)
- 📈 **Analytics** — Revenue charts, top items, customer satisfaction
- 🍴 **Menu Manager** — Add/edit/delete items, PDF menu import, pricing control
- 🔐 **QR Generator** — Print-ready QR codes per branch/table
- 📍 **Tables** — Add/edit branch table configurations
- 👥 **Users** — Provision staff & admin accounts, role assignments
- 🛡️ **Security** — Password reset, session management
- 🎁 **Loyalty** — Member directory, tier stats, redemption tracking

### 5. Security & Auth
- 🔐 bcryptjs password hashing (never plaintext)
- 🎫 JWT-signed sessions with httpOnly cookies
- 🚪 Role-based access control (Admin vs Staff)
- 🌍 Branch scoping (staff can only see their branch)
- ✅ Server-side session validation on every request

### 6. Real-Time Sync
- 🔄 WebSocket (Socket.io) for instant order updates
- 📲 KDS sees new orders immediately (no lag)
- 💬 Waiter call alerts broadcast to all staff
- 📱 Customer app gets live order status changes
- ⏱️ Fallback polling (20s) if Socket connection drops

### 7. Data Persistence
- 💾 All data saved to `/data/` folder (JSON files)
- 🔄 Survives server restarts (no lost orders)
- ⚡ Atomic writes (temp file + rename = crash-safe)
- 🚀 Easy to upgrade to PostgreSQL later (API unchanged)

---

## 🌍 Multi-Language

All customer-facing text supports:
- 🇬🇧 English
- 🇸🇦 العربية (Arabic, RTL layout)
- 🇵🇰 اردو (Urdu, RTL layout)

Language auto-detected from browser settings or manual toggle via flag menu.

---

## 🛠️ Development

### Build Production Assets
```bash
npm run build
```

### Type Check (No Emit)
```bash
npx tsc --noEmit
```

### Start Production Server
```bash
npm run start
```

### Vite Dev Server (With Hot Reload)
```bash
npm run dev
```

---

## 📊 API Endpoints

### Public (No Auth)
- `GET /api/menu` — List menu items
- `GET /api/tables` — List tables
- `POST /api/orders` — Place order
- `GET /api/loyalty/:phone` — Lookup loyalty balance
- `POST /api/reviews` — Submit review

### Protected (Requires Login)
- `POST /api/auth/login` — Authenticate user
- `GET /api/auth/me` — Verify session
- `POST /api/auth/logout` — End session
- `GET /api/orders` — List all orders (admin/staff only)
- `PUT /api/orders/:id/status` — Update order status
- `GET /api/analytics` — Sales analytics (admin only)
- Plus endpoints for menu, users, tables management

---

## 🚀 Deployment

### Option 1: Cloud Run (Recommended)
```bash
# 1. Create .env.prod file with production variables
# 2. Push to Google Cloud Run
gcloud run deploy albrazin-restaurant --source .
```

### Option 2: Railway, Heroku, or any Node.js Host
1. Upload/push the entire project folder (including `package.json`)
2. Set environment variables in platform settings:
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Run `npm install && npm run start`

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## ⚠️ Important Notes

### Passwords
- All default passwords must be changed immediately after first login
- Use the Admin → Users tab to update credentials
- Passwords are hashed with bcrypt (never stored as plaintext)

### Session Security
- Sessions persist via httpOnly cookies (cannot access via JavaScript)
- Set `NODE_ENV=production` for HTTPS-only cookies
- JWT tokens expire after 12 hours

### Data Backups
- Regularly backup the `/data/` folder
- JSON files are human-readable (can be backed up to Git with caution)
- For production, consider periodic exports to PostgreSQL

---

## 📖 Full Documentation

See [FEATURES.md](./FEATURES.md) for comprehensive documentation of every feature, including:
- Detailed workflow explanations
- Loyalty program mechanics
- Security model
- Troubleshooting guide
- Roadmap for future enhancements

---

## 💡 Support & Feedback

For issues, feature requests, or deployment help, contact the development team or refer to the in-app help icons (?) throughout the interface.

---

**Al-Brazin Restaurant Group — Powering Fine Dining with AI**  
*v2.0 — Enhanced with Security, Real-Time Sync, and Loyalty Rewards*
