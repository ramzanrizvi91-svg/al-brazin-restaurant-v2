import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_MENU, BRANCHES, TABLES, MOCK_ANALYTICS } from './src/initialData';
import { MenuItem, Order, WaiterCall, CartItem, LoyaltyAccount, LoyaltyTransaction, StaffUser } from './src/types';
import { hashPassword, verifyPassword, signSession, setSessionCookie, clearSessionCookie, attachSession, requireRole } from './server/auth';
import { computeTier, isValidPhone, normalizePhone, POINTS_PER_SAR, POINT_VALUE_SAR, TIER_MULTIPLIER } from './server/loyalty';

// Load environment variables
dotenv.config();

// ---------------- Persistence Helpers (data/ folder, JSON files) ----------------
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJSON<T>(name: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`[data] Failed to parse ${name}.json, using fallback.`, e);
    }
  }
  return fallback;
}

function persist(name: string, data: unknown) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cookieParser());
app.use(attachSession);

// ---------------- Database State (persisted to /data/*.json on every write) ----------------
// Default (first-boot) accounts — passwords are hashed with bcrypt before ever touching disk.
// IMPORTANT: change these default passwords immediately after your first deploy
// (Admin Portal -> Users tab), especially the Super Admin account.
const DEFAULT_USERS: StaffUser[] = [
  { id: 'usr_1', username: 'admin', passwordHash: hashPassword('admin123'), role: 'admin', branchId: null, label: 'Super Admin (All Branches)', details: 'Full SaaS control' },
  { id: 'usr_2', username: 'golden', passwordHash: hashPassword('riyadh123'), role: 'staff', branchId: 'golden', label: 'Golden Riyadh Branch', details: 'KDS & Cashier' },
  { id: 'usr_3', username: 'diamond', passwordHash: hashPassword('jeddah123'), role: 'staff', branchId: 'diamond', label: 'Diamond Jeddah Branch', details: 'KDS & Cashier' },
  { id: 'usr_4', username: 'prestigino', passwordHash: hashPassword('khobar123'), role: 'staff', branchId: 'prestigino', label: 'Al Khobar Main Branch', details: 'KDS & Cashier' },
  { id: 'usr_5', username: 'mirage', passwordHash: hashPassword('dammam123'), role: 'staff', branchId: 'mirage', label: 'Mirage Dammam Branch', details: 'KDS & Cashier' },
  { id: 'usr_6', username: 'alrashid', passwordHash: hashPassword('rashid123'), role: 'staff', branchId: 'al_rashid', label: 'Al Rashid Branch', details: 'KDS & Cashier' }
];

let menuList: MenuItem[] = loadJSON('menu', JSON.parse(JSON.stringify(INITIAL_MENU)));
let tableList = loadJSON('tables', JSON.parse(JSON.stringify(TABLES)));
let userList: StaffUser[] = loadJSON('users', DEFAULT_USERS);
let loyaltyAccounts: LoyaltyAccount[] = loadJSON('loyalty_accounts', []);
let loyaltyTransactions: LoyaltyTransaction[] = loadJSON('loyalty_transactions', []);

// Persist any freshly-seeded state immediately so /data files exist from boot 1.
persist('menu', menuList);
persist('tables', tableList);
persist('users', userList);
persist('loyalty_accounts', loyaltyAccounts);
persist('loyalty_transactions', loyaltyTransactions);

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord_1',
    branchId: 'golden',
    branchName: 'Golden Restaurant',
    tableNumber: '10',
    area: 'VIP',
    items: [
      { menuItemId: 'main_1', name: 'Wagyu Beef Burger', price: 69, quantity: 2 },
      { menuItemId: 'drink_1', name: 'Limon Mint Mojito', price: 18, quantity: 2 }
    ],
    totalAmount: 174,
    status: 'Cooking',
    paymentMethod: 'ApplePay',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 min ago
  },
  {
    id: 'ord_2',
    branchId: 'prestigino',
    branchName: 'Prestigino Restaurant',
    tableNumber: '3',
    area: 'Open',
    items: [
      { menuItemId: 'main_2', name: 'Prestigino Ribeye Steak', price: 159, quantity: 1 },
      { menuItemId: 'drink_2', name: 'Saudi Sparkling Gold', price: 24, quantity: 1 }
    ],
    totalAmount: 183,
    status: 'Pending',
    paymentMethod: 'Counter',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago
  },
  {
    id: 'ord_3',
    branchId: 'diamond',
    branchName: 'Diamond Restaurant',
    tableNumber: '5',
    area: 'VIP',
    items: [
      { menuItemId: 'main_3', name: 'Saffron Seafood Risotto', price: 89, quantity: 1 },
      { menuItemId: 'dessert_1', name: 'Pistachio Sensation Cake', price: 45, quantity: 1 }
    ],
    totalAmount: 134,
    status: 'Ready',
    paymentMethod: 'CreditCard',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() // 40 min ago
  },
  {
    id: 'ord_4',
    branchId: 'mirage',
    branchName: 'Mirage Restaurant',
    tableNumber: '16',
    area: 'Family',
    items: [
      { menuItemId: 'starter_2', name: 'Truffle Parmesan Fries', price: 29, quantity: 2 },
      { menuItemId: 'dessert_2', name: 'Chocolate Lava Dome', price: 39, quantity: 1 }
    ],
    totalAmount: 97,
    status: 'Served',
    paymentMethod: 'Mada',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  }
];

const DEFAULT_WAITER_CALLS: WaiterCall[] = [
  {
    id: 'call_1',
    branchId: 'golden',
    branchName: 'Golden Restaurant',
    tableNumber: '11',
    area: 'VIP',
    status: 'Pending',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  }
];

const DEFAULT_REVIEWS: any[] = [
  { id: 'rev_1', branchId: 'golden', rating: 5, comment: "The Wagyu Beef Burger is absolutely out of this world! Incredible flavor and perfectly juicy. AI waiter was so helpful and suggested the mojito which was excellent.", createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'rev_2', branchId: 'prestigino', rating: 4, comment: "Amazing Prestigino Ribeye, cooked perfectly medium rare. The fries were a bit cold but the overall luxury vibe and quick service made up for it.", createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'rev_3', branchId: 'diamond', rating: 5, comment: "Saffron seafood risotto was rich, creamy, and loaded with fresh shrimp. Pistachio cake is a masterpiece! Highly recommended.", createdAt: new Date(Date.now() - 10 * 3600000).toISOString() },
  { id: 'rev_4', branchId: 'mirage', rating: 3, comment: "Lava cake is nice but the waiting time for fries was slightly long. The AI helper is super smart though, love the design.", createdAt: new Date(Date.now() - 20 * 3600000).toISOString() }
];

// In-memory working copies, loaded from disk if present (else seeded from the defaults above).
let ordersList: Order[] = loadJSON('orders', DEFAULT_ORDERS);
let waiterCallsList: WaiterCall[] = loadJSON('waiter_calls', DEFAULT_WAITER_CALLS);
let reviewsList: any[] = loadJSON('reviews', DEFAULT_REVIEWS);
persist('orders', ordersList);
persist('waiter_calls', waiterCallsList);
persist('reviews', reviewsList);

// ---------------- Real-time (Socket.IO) ----------------
// Assigned once the HTTP server boots (see startServer at the bottom of this file).
let io: SocketIOServer;
function emitEvent(event: string, payload: unknown) {
  if (io) io.emit(event, payload);
}

// AI Sentiment & Rating Analysis Engine using Gemini
async function analyzeReviewsWithAI() {
  const ratings = reviewsList.map(r => r.rating);
  const avgMath = ratings.length ? parseFloat((ratings.reduce((s, x) => s + x, 0) / ratings.length).toFixed(2)) : 5.0;

  let aiScore = Math.round(avgMath * 20); // e.g. 4.5 -> 90
  let aiAvgRating = avgMath;
  let highlights = [
    "Wagyu Beef Burger is a stellar crowd favorite across Golden Riyadh.",
    "Ribeye Steak is highly praised for flavor, but check side fries serving temperatures.",
    "Highly interactive and convenient experience with the AI Waiter concierge."
  ];

  if (!process.env.GEMINI_API_KEY) {
    return { averageRating: avgMath, aiSatisfactionScore: aiScore, aiHighlights: highlights };
  }

  let attempts = 0;
  const maxAttempts = 2;
  while (attempts < maxAttempts) {
    try {
      const prompt = `You are an AI Hospitality & Culinary Sentiment Analyzer for Al-Brazin Restaurant Group.
We have received the following guest reviews:
${JSON.stringify(reviewsList, null, 2)}

Analyze the rating values and text comments. Calculate:
1. An overall customer satisfaction score (out of 100), adjusting for tone (e.g. enthusiastic words increase the score, polite complaints decrease it slightly).
2. An AI dynamic average customer rating (between 1.0 and 5.0) which analyzes the sentiment and intensity of the written comments alongside the raw stars.
3. Generate exactly three short, professional, and action-oriented highlight bullet points summarizing the menu favorites or service issues.

Respond with ONLY a raw, valid JSON object without markdown formatting blocks, adhering exactly to this schema:
{
  "aiSatisfactionScore": number, // an integer from 1 to 100
  "aiAverageRating": number, // a decimal float from 1.0 to 5.0, e.g. 4.62
  "aiHighlights": string[] // exactly three concise bullet points
}`;

      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = res.text?.trim() || "";
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (parsed) {
        if (typeof parsed.aiSatisfactionScore === 'number') {
          aiScore = parsed.aiSatisfactionScore;
        }
        if (typeof parsed.aiAverageRating === 'number') {
          aiAvgRating = parseFloat(parsed.aiAverageRating.toFixed(2));
        }
        if (Array.isArray(parsed.aiHighlights)) {
          highlights = parsed.aiHighlights;
        }
      }
      break; // Success! Break retry loop
    } catch (error: any) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.log('[Sentiment Analyzer] Service temporarily offline or rate-limited. Serving pre-computed sentiment fallback values.');
      } else {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  return {
    averageRating: aiAvgRating,
    aiSatisfactionScore: aiScore,
    aiHighlights: highlights
  };
}

// Helper to calculate total revenue per branch for analytics
function getBranchRevenue() {
  const revenueMap: { [key: string]: number } = {};
  BRANCHES.forEach(b => {
    revenueMap[b.name] = 20000; // Seed baseline
  });

  ordersList.forEach(o => {
    if (o.status !== 'Pending') {
      revenueMap[o.branchName] = (revenueMap[o.branchName] || 0) + o.totalAmount;
    }
  });

  return Object.keys(revenueMap).map(name => ({
    branchName: name,
    revenue: revenueMap[name]
  }));
}

// ---------------- API ENDPOINTS ----------------

app.get('/api/debug-paths', (req, res) => {
  const distPath = path.join(process.cwd(), 'dist');
  let distExists = false;
  let distContents: string[] = [];
  try {
    distExists = fs.existsSync(distPath);
    if (distExists) {
      distContents = fs.readdirSync(distPath);
    }
  } catch (e: any) {
    console.error(e);
  }
  res.json({
    cwd: process.cwd(),
    distExists,
    distContents,
    envNodeEnv: process.env.NODE_ENV,
    url: req.url,
    headers: req.headers
  });
});

// 1. Menu Management
app.get('/api/menu', (req, res) => {
  res.json(menuList);
});

app.post('/api/menu', requireRole('admin'), (req, res) => {
  const newItem: MenuItem = {
    id: 'item_' + Date.now(),
    ...req.body
  };
  menuList.push(newItem);
  persist('menu', menuList);
  res.status(201).json(newItem);
});

app.put('/api/menu/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const index = menuList.findIndex(item => item.id === id);
  if (index !== -1) {
    menuList[index] = { ...menuList[index], ...req.body };
    persist('menu', menuList);
    res.json(menuList[index]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/menu/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const index = menuList.findIndex(item => item.id === id);
  if (index !== -1) {
    const deleted = menuList.splice(index, 1);
    persist('menu', menuList);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.post('/api/menu/reset', requireRole('admin'), (req, res) => {
  menuList = JSON.parse(JSON.stringify(INITIAL_MENU));
  persist('menu', menuList);
  res.json(menuList);
});

// 1.1 Upload PDF or Excel Menu and parse using Gemini
app.post('/api/upload-menu', requireRole('admin'), async (req, res) => {
  try {
    const { base64, filename, mimeType } = req.body;
    if (!base64 || !mimeType) {
      return res.status(400).json({ error: "Missing base64 or mimeType" });
    }

    let parsedItems = [];

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found. Simulating menu upload parser based on filename.");
      parsedItems = [
        {
          name: `Premium Imported Dish (${filename.split('.')[0]})`,
          category: 'Mains',
          description: 'An exquisite luxury dish parsed from your uploaded document.',
          price: 125,
          ingredients: ['Imported Beef', 'Saffron Rice', 'Signature Sauce'],
          calories: 550,
          taste: 'Rich & Savory',
          isPopular: true
        },
        {
          name: 'Special Star Drink',
          category: 'Drinks',
          description: 'A refreshing premium beverage with gold flakes.',
          price: 35,
          ingredients: ['Mint', 'Lemon', 'Sparkling Water', 'Edible Gold'],
          calories: 120,
          taste: 'Sweet & Zesty',
          isVegetarian: true
        }
      ];
    } else {
      const docPart = {
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      };

      const prompt = `You are an expert hospitality data entry clerk for Al-Brazin Restaurant Group.
You are given an uploaded menu document named "${filename}".
Please analyze this document and extract all the food or drink items listed in it.

Generate a JSON array of items where each item has these properties:
- "name": string (the name of the dish)
- "category": string (MUST be strictly one of these: 'Starters', 'Mains', 'Desserts', 'Drinks')
- "description": string (short description)
- "price": number (in SAR, e.g., 65)
- "ingredients": string[] (array of main ingredients)
- "calories": number (approximate calories)
- "taste": string (short taste profile like "Rich & Savory")
- "isSpicy": boolean
- "isVegetarian": boolean
- "isPopular": boolean

Respond ONLY with a valid JSON array, without any markdown blocks or formatting. If there are no items, generate sample items based on the file contents.`;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [docPart, prompt],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = geminiRes.text?.trim() || "";
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedItems = JSON.parse(cleanedText);
    }

    if (!Array.isArray(parsedItems)) {
      throw new Error("Parsed items is not an array");
    }

    const newItems: MenuItem[] = parsedItems.map((item: any, idx: number) => {
      let defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
      const cat = String(item.category || '').toLowerCase();
      if (cat.includes('starter')) {
        defaultImage = 'https://images.unsplash.com/photo-1559742811-82410b451b94?w=500&auto=format&fit=crop&q=60';
      } else if (cat.includes('main')) {
        defaultImage = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60';
      } else if (cat.includes('dessert')) {
        defaultImage = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60';
      } else if (cat.includes('drink')) {
        defaultImage = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60';
      }

      return {
        id: 'uploaded_' + Date.now() + '_' + idx,
        name: String(item.name || 'Unnamed Dish'),
        category: ['Starters', 'Mains', 'Desserts', 'Drinks'].includes(item.category) ? item.category : 'Mains',
        description: String(item.description || 'Premium imported dish.'),
        price: Number(item.price) || 50,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(String) : [],
        calories: Number(item.calories) || 300,
        taste: String(item.taste || 'Delectable'),
        image: defaultImage,
        isSpicy: Boolean(item.isSpicy),
        isVegetarian: Boolean(item.isVegetarian),
        isPopular: Boolean(item.isPopular),
        isAvailable: true,
        branchIds: []
      };
    });

    menuList.push(...newItems);
    persist('menu', menuList);

    res.status(201).json({
      message: `Successfully processed and imported ${newItems.length} items from ${filename}.`,
      importedCount: newItems.length,
      items: newItems
    });
  } catch (error: any) {
    console.error("Menu Upload Parsing Error:", error);
    res.status(500).json({ error: "Failed to parse menu file: " + error.message });
  }
});

// 2. Orders Handling
// Full order list — staff/admin only (contains data across every table & branch).
app.get('/api/orders', requireRole('staff', 'admin'), (req, res) => {
  res.json(ordersList);
});

// Public, scoped endpoint used by the customer's own device to track only
// its own table's orders — does not leak other tables' data.
app.get('/api/orders/by-table', (req, res) => {
  const { branchId, table } = req.query;
  if (!branchId || !table) {
    return res.status(400).json({ error: 'branchId and table are required' });
  }
  const tableOrders = ordersList.filter(o => o.branchId === branchId && o.tableNumber === table);
  res.json(tableOrders);
});

app.post('/api/orders', (req, res) => {
  try {
    const { branchId, tableNumber, area, items, paymentMethod, notes, customerPhone, redeemPoints } = req.body;
    const branch = BRANCHES.find(b => b.id === branchId) || BRANCHES[0];

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // ---- Loyalty: redemption ----
    let discountAmount = 0;
    let actualRedeemedPoints = 0;
    let account: LoyaltyAccount | undefined;
    const cleanPhone = customerPhone ? normalizePhone(customerPhone) : null;

    if (cleanPhone && isValidPhone(cleanPhone)) {
      account = loyaltyAccounts.find(a => a.phone === cleanPhone);
    }

    if (account && redeemPoints && redeemPoints > 0) {
      const requested = Math.min(Math.floor(redeemPoints), account.points);
      const maxDiscountBySubtotal = Math.floor(subtotal / POINT_VALUE_SAR);
      actualRedeemedPoints = Math.min(requested, maxDiscountBySubtotal);
      discountAmount = parseFloat((actualRedeemedPoints * POINT_VALUE_SAR).toFixed(2));
    }

    const totalAmount = parseFloat((subtotal - discountAmount).toFixed(2));

    // ---- Loyalty: earning ----
    let pointsEarned = 0;
    if (cleanPhone && isValidPhone(cleanPhone)) {
      const tierForEarning = account ? account.tier : 'Bronze';
      pointsEarned = Math.floor(totalAmount * POINTS_PER_SAR * TIER_MULTIPLIER[tierForEarning]);
    }

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      branchId: branch.id,
      branchName: branch.name,
      tableNumber: tableNumber || 'Counter',
      area: area || 'Open',
      items,
      totalAmount,
      status: 'Pending',
      paymentMethod: paymentMethod || 'Counter',
      createdAt: new Date().toISOString(),
      notes,
      customerPhone: cleanPhone || undefined,
      discountAmount: discountAmount || undefined,
      loyaltyPointsEarned: pointsEarned || undefined,
      loyaltyPointsRedeemed: actualRedeemedPoints || undefined
    };

    ordersList.unshift(newOrder); // New orders at top
    persist('orders', ordersList);
    emitEvent('order:new', newOrder);

    // Apply loyalty account changes now that the order is confirmed
    let loyaltySummary: any = null;
    if (cleanPhone && isValidPhone(cleanPhone)) {
      const now = new Date().toISOString();
      let acc = loyaltyAccounts.find(a => a.phone === cleanPhone);
      if (!acc) {
        acc = { phone: cleanPhone, points: 0, lifetimePoints: 0, totalSpent: 0, tier: 'Bronze', createdAt: now, updatedAt: now };
        loyaltyAccounts.push(acc);
      }
      acc.points = acc.points - actualRedeemedPoints + pointsEarned;
      acc.lifetimePoints += pointsEarned;
      acc.totalSpent += totalAmount;
      acc.tier = computeTier(acc.lifetimePoints);
      acc.updatedAt = now;

      if (actualRedeemedPoints > 0) {
        loyaltyTransactions.unshift({ id: 'lt_' + Date.now() + '_r', phone: cleanPhone, orderId: newOrder.id, type: 'redeem', points: -actualRedeemedPoints, note: 'Redeemed at checkout', createdAt: now });
      }
      if (pointsEarned > 0) {
        loyaltyTransactions.unshift({ id: 'lt_' + Date.now() + '_e', phone: cleanPhone, orderId: newOrder.id, type: 'earn', points: pointsEarned, note: `Earned from order #${newOrder.id.slice(-4)}`, createdAt: now });
      }
      persist('loyalty_accounts', loyaltyAccounts);
      persist('loyalty_transactions', loyaltyTransactions);

      loyaltySummary = { pointsEarned, pointsRedeemed: actualRedeemedPoints, discountAmount, newBalance: acc.points, tier: acc.tier };
    }

    res.status(201).json({ ...newOrder, loyalty: loyaltySummary });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to place order' });
  }
});

app.put('/api/orders/:id/status', requireRole('staff', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = ordersList.find(o => o.id === id);
  if (order) {
    order.status = status;
    persist('orders', ordersList);
    emitEvent('order:updated', order);
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// 3. Waiter Calling System
app.get('/api/waiter-calls', requireRole('staff', 'admin'), (req, res) => {
  res.json(waiterCallsList);
});

app.post('/api/waiter-calls', (req, res) => {
  const { branchId, tableNumber, area } = req.body;
  const branch = BRANCHES.find(b => b.id === branchId) || BRANCHES[0];
  
  const newCall: WaiterCall = {
    id: 'call_' + Date.now(),
    branchId: branch.id,
    branchName: branch.name,
    tableNumber: tableNumber || '1',
    area: area || 'Open',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  waiterCallsList.unshift(newCall);
  persist('waiter_calls', waiterCallsList);
  emitEvent('waiterCall:new', newCall);
  res.status(201).json(newCall);
});

app.put('/api/waiter-calls/:id', requireRole('staff', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const call = waiterCallsList.find(c => c.id === id);
  if (call) {
    call.status = status;
    persist('waiter_calls', waiterCallsList);
    emitEvent('waiterCall:updated', call);
    res.json(call);
  } else {
    res.status(404).json({ error: 'Call not found' });
  }
});

// 3.5 Tables Management
app.get('/api/tables', (req, res) => {
  res.json(tableList);
});

app.post('/api/tables', requireRole('admin'), (req, res) => {
  const { number, area, branchId } = req.body;
  const newTable = {
    id: 'tbl_' + Date.now(),
    number: String(number || '1'),
    area: area || 'Open',
    branchId: branchId || 'golden'
  };
  tableList.push(newTable);
  persist('tables', tableList);
  res.status(201).json(newTable);
});

app.put('/api/tables/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const index = tableList.findIndex(t => t.id === id);
  if (index !== -1) {
    tableList[index] = { ...tableList[index], ...req.body };
    persist('tables', tableList);
    res.json(tableList[index]);
  } else {
    res.status(404).json({ error: 'Table not found' });
  }
});

app.delete('/api/tables/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const index = tableList.findIndex(t => t.id === id);
  if (index !== -1) {
    const deleted = tableList.splice(index, 1);
    persist('tables', tableList);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Table not found' });
  }
});

// 3.6 Users Management (admin only — passwords are NEVER sent to the client)
app.get('/api/users', requireRole('admin'), (req, res) => {
  res.json(userList.map(({ passwordHash, ...safe }) => safe));
});

app.post('/api/users', requireRole('admin'), (req, res) => {
  const { username, password, role, branchId, label, details } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (userList.some(u => u.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const newUser: StaffUser = {
    id: 'usr_' + Date.now(),
    username,
    passwordHash: hashPassword(password),
    role: role === 'admin' ? 'admin' : 'staff',
    branchId: branchId || null,
    label: label || 'Custom Staff',
    details: details || 'Kitchen & Cashier'
  };
  userList.push(newUser);
  persist('users', userList);
  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.put('/api/users/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const index = userList.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password, ...rest } = req.body;
  const patch: Partial<StaffUser> = { ...rest };
  if (password) {
    patch.passwordHash = hashPassword(password); // only rehash if a new password was actually submitted
  }
  userList[index] = { ...userList[index], ...patch };
  persist('users', userList);
  const { passwordHash, ...safeUser } = userList[index];
  res.json(safeUser);
});

app.delete('/api/users/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  
  if (id === 'usr_1') {
    return res.status(400).json({ error: 'Cannot delete Super Admin account' });
  }

  const index = userList.findIndex(u => u.id === id);
  if (index !== -1) {
    const deleted = userList.splice(index, 1);
    persist('users', userList);
    const { passwordHash, ...safeUser } = deleted[0];
    res.json(safeUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// 3.7 Loyalty Program
// Public: a customer looks up their own balance by phone number at checkout.
app.get('/api/loyalty/:phone', (req, res) => {
  const phone = normalizePhone(req.params.phone);
  const account = loyaltyAccounts.find(a => a.phone === phone);
  if (!account) {
    return res.json({ phone, points: 0, lifetimePoints: 0, totalSpent: 0, tier: 'Bronze', isNew: true });
  }
  res.json(account);
});

// Admin: full list of loyalty members, sorted by current points.
app.get('/api/loyalty', requireRole('staff', 'admin'), (req, res) => {
  const sorted = [...loyaltyAccounts].sort((a, b) => b.points - a.points);
  res.json({ accounts: sorted, transactions: loyaltyTransactions.slice(0, 200) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = userList.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = signSession({
    sub: user.id,
    username: user.username,
    role: user.role as 'admin' | 'staff',
    branchId: user.branchId,
    label: user.label
  });
  setSessionCookie(res, token);

  // Never send the password hash to the client
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// Lets the client verify (with the server as source of truth) whether the
// current session is still valid, instead of blindly trusting localStorage.
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    username: req.user.username,
    role: req.user.role,
    branchId: req.user.branchId,
    branchName: req.user.label
  });
});

// 4. Analytics Data
app.get('/api/analytics', requireRole('admin'), async (req, res) => {
  try {
    // Compute dynamically based on active orders
    const itemCounts: { [key: string]: { quantity: number; revenue: number } } = {};
    
    ordersList.forEach(o => {
      o.items.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });

    const computedTopSelling = Object.keys(itemCounts).map(name => ({
      name,
      quantity: itemCounts[name].quantity,
      revenue: itemCounts[name].revenue
    })).sort((a, b) => b.revenue - a.revenue);

    // Compute AI customer rating & highlights
    const aiAnalysis = await analyzeReviewsWithAI();

    res.json({
      topSellingItems: computedTopSelling.length ? computedTopSelling : MOCK_ANALYTICS.topSellingItems,
      revenuePerBranch: getBranchRevenue(),
      peakHours: MOCK_ANALYTICS.peakHours,
      orderTrends: MOCK_ANALYTICS.orderTrends,
      averageRating: aiAnalysis.averageRating,
      aiSatisfactionScore: aiAnalysis.aiSatisfactionScore,
      aiHighlights: aiAnalysis.aiHighlights,
      reviews: reviewsList
    });
  } catch (error) {
    console.error("Analytics Calculation Error:", error);
    res.status(500).json({ error: "Failed to generate analytics data" });
  }
});

// 4.1 Reviews & Feedback Endpoints
app.get('/api/reviews', (req, res) => {
  res.json(reviewsList);
});

app.post('/api/reviews', (req, res) => {
  try {
    const { branchId, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const newReview = {
      id: 'rev_' + Date.now(),
      branchId: branchId || 'golden',
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    reviewsList.unshift(newReview);
    persist('reviews', reviewsList);
    res.status(201).json(newReview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Caching Layer & Pre-warm Mechanism
const promptContextCache = new Map<string, { systemInstruction: string; timestamp: number }>();
let cachedStringifiedMenu = '';
let menuCacheTimestamp = 0;

function getMenuString() {
  if (!cachedStringifiedMenu || (Date.now() - menuCacheTimestamp > 60000)) { // 1 minute cache
    cachedStringifiedMenu = JSON.stringify(menuList, null, 2);
    menuCacheTimestamp = Date.now();
  }
  return cachedStringifiedMenu;
}

// Pre-warm context and prime connection latency
app.post('/api/chat/prewarm', async (req, res) => {
  try {
    const { branchId, tableNumber, area } = req.body;
    const branch = BRANCHES.find(b => b.id === branchId) || BRANCHES[0];
    const customerArea = area || 'Open';
    const customerTable = tableNumber || '10';
    const cacheKey = `${branch.id}_${customerTable}_${customerArea}`;

    const systemInstruction = `
You are "Al-Brazin AI Waiter", a premium virtual headwaiter and expert food concierge for the "Al-Brazin Restaurants & Co." luxury multi-branch chain.
The branches are:
- Golden Restaurant (in Riyadh)
- Diamond Restaurant
- Prestigino Restaurant
- Mirage Restaurant
- Al Rashid Al Khobar Restaurant

Your tone is extremely warm, polished, hospitable, and highly attentive—equal to a Michelin-star waiter.

Core Directives for a User-Friendly, Human-to-Human Conversation:
1. Support English, Arabic (العربية), and Urdu/Hindi (اردو/हिंदी). Respond fluently and naturally in the language the customer greets you with.
2. Keep responses extremely brief, friendly, and natural—just like a natural human waiter would talk at a high-end restaurant. Avoid long lists, verbose disclaimers, or robot-like output.
3. ONLY explain what the customer asks for. Do not volunteer lists of ingredients, prep methods, or nutritional info unless explicitly asked by the customer.
4. If a customer requests advanced culinary explanations (e.g., preparation styles, texture, luxury presentation, or chef techniques), provide an upscale, premium, expert answer if you have the capability.
5. If a customer asks what DRINKS are available, list the available drinks on the menu clearly (mention "Limon Mint Mojito", "Saudi Sparkling Gold" mocktail, and "Double Espresso" with their details if appropriate). Do not make up drinks not on the list.
6. If the customer asks for SUGGESTIONS, warmly offer our premium specialties (such as "Spicy Shrimp" starter, "Wagyu Beef Burger", "Prestigino Ribeye Steak", and "Pistachio Sensation Cake" dessert).
7. Rely ONLY on the menu items provided below. Do not recommend or describe dishes that are not on this exact list.
8. Be an expert on calories, dietary options (vegetarian, spicy), flavor profiles, and allergen questions based strictly on the ingredients.
9. You have a real-time tool "updateCart" which lets you add, remove, or modify items in the guest's digital shopping cart. Whenever the customer requests to "add", "add more", "remove", "take off", or "change" items, you MUST CALL THE updateCart TOOL. Do not just talk about it; invoke the tool with the precise item names.
10. CRITICAL AVAILABILITY CHECK: If an item in the Menu Dataset has isAvailable: false, it is OUT OF STOCK. If the customer tries to order it, you MUST politefully explain that it is currently unavailable or sold out at this branch, and warmly recommend a delicious alternative that is in stock. Do NOT add any out-of-stock items to the cart.
11. STRICT AL-BRAZIN BRAND IDENTITY: Always represent the elite "Al-Brazin Restaurant Group" or "Al-Brazin Restaurant". When greeting, say "Welcome to Al-Brazin's [Branch] Branch" (e.g. Al-Brazin's Diamond Branch). NEVER refer to yourself under the sole name "Diamond Restaurant" or pretend to be an independent entity.
12. EXTREME CONCISENESS & SIMPLE ANSWERS: The customer wants simple, highly specific answers. Answer ONLY the exact part they asked about, without lengthy, extra, or unrequested explanations. Just answer the question asked with a simple, direct answer (typically 1 sentence maximum) to maintain a lightning-fast, snappy human-to-human flow. Do not provide fluff.

Menu Dataset (Your Source of Truth):
${getMenuString()}

Guest's Current Context:
- Branch: ${branch.name}
- Table Number: ${customerTable}
- Section: ${customerArea}

Your Cart State Right Now:
[]
`;

    promptContextCache.set(cacheKey, {
      systemInstruction,
      timestamp: Date.now()
    });

    // Run async background connection warming call to Gemini API to eliminate cold-start latency
    ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "ping",
      config: {
        systemInstruction: "You are Al-Brazin AI Waiter. Warm up response.",
        maxOutputTokens: 5,
        temperature: 0.1
      }
    }).then(() => {
      console.log(`[Prewarm] Connection and cache warmed successfully for table: ${customerTable}`);
    }).catch(err => {
      console.warn(`[Prewarm] Background warmup notice:`, err?.message);
    });

    res.json({ status: 'warmed', cacheKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback Virtual Waiter Agent for seamless service when Gemini API is rate-limited or unavailable
function runFallbackAgent(userMessage: string, currentCart: any[], branchName: string, customerTable: string, branchId: string, customerArea: string) {
  const text = userMessage.toLowerCase().trim();
  let updatedCart = [...currentCart];
  let textResponse = '';
  let toolCallTriggered = false;
  let orderPlacedSignal = false;
  let createdOrder: any = null;

  // Language Detection
  const isArabic = /[\u0600-\u06FF]/.test(userMessage);
  const isHindiUrdu = /[\u0900-\u097F]/.test(userMessage) || /shukriya|namaste|khana|order/i.test(userMessage) && !/burger|steak/i.test(userMessage);

  // Dynamic Specific Menu Item / Drink Question Detector
  let mentionedItem = null;
  for (const item of menuList) {
    if (text.includes(item.name.toLowerCase())) {
      mentionedItem = item;
      break;
    }
  }
  if (!mentionedItem) {
    // Try fuzzier match on keywords
    for (const item of menuList) {
      const parts = item.name.toLowerCase().split(' ');
      const keyWords = parts.filter(p => p.length > 3 && p !== 'with' && p !== 'beef' && p !== 'dome' && p !== 'cake' && p !== 'gold' && p !== 'rings' && p !== 'mint');
      if (keyWords.some(k => text.includes(k))) {
        mentionedItem = item;
        break;
      }
    }
  }

  // Answer specific questions if an item is matched
  if (mentionedItem) {
    // A. Price question
    if (text.includes('price') || text.includes('how much') || text.includes('cost') || text.includes('سعر') || text.includes('بكم') || text.includes('كم')) {
      if (isArabic) {
        textResponse = `سعر "${mentionedItem.name}" هو ${mentionedItem.price} ريال سعودي.`;
      } else {
        textResponse = `The price of ${mentionedItem.name} is ${mentionedItem.price} SAR.`;
      }
      return { response: textResponse, updatedCart, toolCallTriggered, orderPlacedSignal, createdOrder };
    }
    // B. Calories question
    if (text.includes('calorie') || text.includes('calories') || text.includes('سعرات') || text.includes('حرارية') || text.includes('سعر حراري')) {
      if (isArabic) {
        textResponse = `يحتوي "${mentionedItem.name}" على ${mentionedItem.calories} سعرة حرارية.`;
      } else {
        textResponse = `The ${mentionedItem.name} has ${mentionedItem.calories} calories.`;
      }
      return { response: textResponse, updatedCart, toolCallTriggered, orderPlacedSignal, createdOrder };
    }
    // C. Ingredients question
    if (text.includes('ingredient') || text.includes('ingredients') || text.includes('contain') || text.includes('allergy') || text.includes('مكونات') || text.includes('مكون')) {
      if (isArabic) {
        textResponse = `مكونات "${mentionedItem.name}" هي: ${mentionedItem.ingredients.join('، ')}.`;
      } else {
        textResponse = `The ingredients of ${mentionedItem.name} are: ${mentionedItem.ingredients.join(', ')}.`;
      }
      return { response: textResponse, updatedCart, toolCallTriggered, orderPlacedSignal, createdOrder };
    }
    // D. Description/Describe question (user explicitly said "describe drinks" or "describe burger")
    if (text.includes('describe') || text.includes('what is') || text.includes('about') || text.includes('وصف') || text.includes('ما هو') || text.includes('تفاصيل')) {
      if (isArabic) {
        textResponse = `"${mentionedItem.name}" هو: ${mentionedItem.description} وسعره ${mentionedItem.price} ريال سعودي.`;
      } else {
        textResponse = `${mentionedItem.name}: ${mentionedItem.description} (Price: ${mentionedItem.price} SAR).`;
      }
      return { response: textResponse, updatedCart, toolCallTriggered, orderPlacedSignal, createdOrder };
    }
  }

  // 1. PLACE / CONFIRM ORDER
  if (
    text.includes('confirm') || 
    text.includes('place order') || 
    text.includes('place my order') || 
    text.includes('order now') || 
    text.includes('checkout') || 
    text.includes('check out') || 
    text.includes('تأكيد') || 
    text.includes('طلب') || 
    text.includes('الحساب') ||
    text.includes('اطلب')
  ) {
    if (updatedCart.length > 0) {
      toolCallTriggered = true;
      orderPlacedSignal = true;
      const totalAmount = updatedCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      createdOrder = {
        id: 'ord_' + Date.now(),
        branchId: branchId,
        branchName: branchName,
        tableNumber: customerTable,
        area: customerArea,
        items: [...updatedCart],
        totalAmount,
        status: 'Pending',
        paymentMethod: 'Counter',
        createdAt: new Date().toISOString(),
        notes: ''
      };
      
      ordersList.unshift(createdOrder);
      persist('orders', ordersList);
      emitEvent('order:new', createdOrder);
      updatedCart = []; // Clear cart on place order

      if (isArabic) {
        textResponse = `ممتاز! لقد تم تقديم طلبك بنجاح إلى المطبخ. يقوم طهاة البرازين المتميزون بإعداده الآن. يمكنك متابعة حالة الطلب والطلب النشط مباشرة على شاشتك.`;
      } else if (isHindiUrdu) {
        textResponse = `بہترین! آپ کا آرڈر کچن میں بھیج دیا گیا ہے۔ ہمارے شیف اسے تیار کر رہے ہیں۔ آپ اپنی سکرین پر آرڈر کا سٹیٹس دیکھ سکتے ہیں۔`;
      } else {
        textResponse = `Perfect! I have successfully submitted your order to the kitchen. Our Al-Brazin master chefs are preparing it with absolute dedication right now. You can track its live status on your screen.`;
      }
    } else {
      if (isArabic) {
        textResponse = `سلتك فارغة حالياً! يرجى اختيار بعض الأطباق اللذيذة من قائمة الطعام أولاً، وسأكون سعيداً بتقديم الطلب لك.`;
      } else if (isHindiUrdu) {
        textResponse = `آپ کا کارٹ خالی ہے! براہ کرم پہلے مینو سے کچھ لذیذ کھانے منتخب کریں۔`;
      } else {
        textResponse = `Your cart is currently empty! Please select some exquisite dishes from our menu first, and I will be delighted to place the order for you instantly.`;
      }
    }
  }
  // 2. ADD ITEMS TO CART
  else if (
    text.includes('add') || 
    text.includes('order') || 
    text.includes('want') || 
    text.includes('get') || 
    text.includes('please') || 
    text.includes('bring') || 
    text.includes('أريد') || 
    text.includes('اضافة') || 
    text.includes('ضيف') ||
    text.includes('طلب') ||
    text.includes('لازم') ||
    text.includes('bring')
  ) {
    let matchedItem = null;
    for (const item of menuList) {
      const nameLower = item.name.toLowerCase();
      if (
        text.includes(nameLower) || 
        (nameLower.includes('shrimp') && (text.includes('shrimp') || text.includes('روبيان') || text.includes('جمبري'))) ||
        (nameLower.includes('burger') && (text.includes('burger') || text.includes('برجر') || text.includes('برغر'))) ||
        (nameLower.includes('steak') && (text.includes('steak') || text.includes('ستيك') || text.includes('لحم'))) ||
        (nameLower.includes('fries') && (text.includes('fries') || text.includes('بطاطس') || text.includes('بطاطا'))) ||
        (nameLower.includes('calamari') && (text.includes('calamari') || text.includes('كالاماري') || text.includes('حبار'))) ||
        (nameLower.includes('risotto') && (text.includes('risotto') || text.includes('ريزوتو') || text.includes('ارز'))) ||
        (nameLower.includes('mojito') && (text.includes('mojito') || text.includes('موهيتو') || text.includes('عصير'))) ||
        (nameLower.includes('espresso') && (text.includes('espresso') || text.includes('قهوة') || text.includes('اسبريسو'))) ||
        (nameLower.includes('sparkling gold') && (text.includes('sparkling') || text.includes('gold') || text.includes('فوار'))) ||
        (nameLower.includes('pistachio') && (text.includes('pistachio') || text.includes('بستاشيو') || text.includes('فستق'))) ||
        (nameLower.includes('lava') && (text.includes('lava') || text.includes('لافا') || text.includes('شوكولاته')))
      ) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      let quantity = 1;
      const matchQty = text.match(/\b([1-9])\b/);
      if (matchQty) {
        quantity = parseInt(matchQty[1], 10);
      }

      if (matchedItem.isAvailable === false) {
        if (isArabic) {
          textResponse = `معذرةً، طبق "${matchedItem.name}" غير متوفر أو نفذت كميته اليوم. هل يمكنني أن أقترح عليك بديلاً رائعاً من قائمة طعام البرازين المميزة؟`;
        } else if (isHindiUrdu) {
          textResponse = `معذرت، لیکن "${matchedItem.name}" فی الحال ختم ہو چکا ہے۔ کیا میں آپ کو کوئی دوسرا لذیذ کھانا تجویز کروں؟`;
        } else {
          textResponse = `I'm deeply sorry, but our premium "${matchedItem.name}" is currently sold out today. I cannot add it to your cart, but I would be delighted to recommend another signature alternative from our Al-Brazin menu.`;
        }
      } else {
        toolCallTriggered = true;
        const existingIndex = updatedCart.findIndex(i => i.menuItemId === matchedItem.id);
        if (existingIndex !== -1) {
          updatedCart[existingIndex].quantity += quantity;
        } else {
          updatedCart.push({
            menuItemId: matchedItem.id,
            name: matchedItem.name,
            price: matchedItem.price,
            quantity: quantity
          });
        }

        if (isArabic) {
          textResponse = `اختيار رائع وموفق! لقد قمت بإضافة ${quantity}x "${matchedItem.name}" إلى سلة مشترياتك. هل ترغب في إضافة أي مشروبات منعشة أو أطباق أخرى مرافقة؟`;
        } else if (isHindiUrdu) {
          textResponse = `بہترین انتخاب! میں نے ${quantity}x "${matchedItem.name}" آپ کے کارٹ میں شامل کر دیا ہے۔ کیا آپ کچھ اور بھی پسند کریں گے؟`;
        } else {
          textResponse = `Excellent choice! I have successfully added ${quantity}x "${matchedItem.name}" to your cart. Would you like to add some refreshing premium drinks or another signature selection to accompany this?`;
        }
      }
    } else {
      if (isArabic) {
        textResponse = `أود مساعدتك في إضافة هذا إلى السلة، لكنني لم أستطع مطابقة اسم الطبق تماماً. هل يمكنك تحديد اسم الطبق المتوفر في قائمة الطعام بدقة؟`;
      } else if (isHindiUrdu) {
        textResponse = `میں کارٹ میں شامل کرنے میں خوشی محسوس کروں گا، لیکن مجھے کھانے کا نام مینو میں نہیں ملا۔ براہ کرم مینو سے درست نام بتائیں۔`;
      } else {
        textResponse = `I would love to help you add that to your cart, but I couldn't quite match the dish name to our menu. Could you please specify the exact name of the menu item you would like to add?`;
      }
    }
  }
  // 3. REMOVE ITEMS FROM CART
  else if (
    text.includes('remove') || 
    text.includes('delete') || 
    text.includes('take off') || 
    text.includes('cancel') || 
    text.includes('حذف') || 
    text.includes('إزالة') || 
    text.includes('الغاء') || 
    text.includes('شيل')
  ) {
    let matchedItem = null;
    for (const item of menuList) {
      const nameLower = item.name.toLowerCase();
      if (
        text.includes(nameLower) || 
        (nameLower.includes('shrimp') && (text.includes('shrimp') || text.includes('روبيان') || text.includes('جمبري'))) ||
        (nameLower.includes('burger') && (text.includes('burger') || text.includes('برجر'))) ||
        (nameLower.includes('steak') && (text.includes('steak') || text.includes('ستيك'))) ||
        (nameLower.includes('fries') && (text.includes('fries') || text.includes('بطاطس'))) ||
        (nameLower.includes('mojito') && (text.includes('mojito') || text.includes('موهيتو')))
      ) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      toolCallTriggered = true;
      const existingIndex = updatedCart.findIndex(i => i.menuItemId === matchedItem.id);
      if (existingIndex !== -1) {
        updatedCart.splice(existingIndex, 1);
        if (isArabic) {
          textResponse = `لقد قمت بإزالة طبق "${matchedItem.name}" من سلتك بنجاح. أخبرني إذا كنت تريد إجراء أي تعديلات أخرى.`;
        } else if (isHindiUrdu) {
          textResponse = `میں نے "${matchedItem.name}" آپ کے کارٹ سے ہٹا دیا ہے۔`;
        } else {
          textResponse = `I have successfully removed "${matchedItem.name}" from your cart. Please let me know if you would like to make any other changes to your order.`;
        }
      } else {
        if (isArabic) {
          textResponse = `لم أتمكن من العثور على طبق "${matchedItem.name}" في سلتك، لذا لم يتم أي تغيير.`;
        } else {
          textResponse = `I couldn't find "${matchedItem.name}" in your active cart, so no changes were made.`;
        }
      }
    } else {
      if (isArabic) {
        textResponse = `ما هو الطبق الذي ترغب في إزالته من السلة؟ يرجى تحديد اسمه بدقة.`;
      } else {
        textResponse = `Which item would you like to remove from your cart? Please specify the exact name of the item.`;
      }
    }
  }
  // 4. GREETINGS
  else if (
    text.includes('hello') || 
    text.includes('hi') || 
    text.includes('hey') || 
    text.includes('welcome') || 
    text.includes('مرحبا') || 
    text.includes('السلام') || 
    text.includes('أهلاً') || 
    text.includes('سلام') ||
    text.includes('namaste') ||
    text.includes('adaab') ||
    text.includes('salam')
  ) {
    const cleanBranch = branchName.replace(' Restaurant', '');
    if (isArabic) {
      textResponse = `مرحباً بك في مطعم البرازين فرع ${cleanBranch}! أنا نادل الذكاء الاصطناعي لخدمة الطاولة رقم ${customerTable}. يسعدني ويشرفني جداً خدمتك ومساعدتك اليوم. ماذا يمكنني أن أحضر لك؟`;
    } else if (isHindiUrdu) {
      textResponse = `البرازین ریسٹورنٹ کے ${cleanBranch} برانچ میں خوش آمدید! میں ٹیبل نمبر ${customerTable} کے لیے آپ کا ڈیجیٹل ویٹر ہوں۔ آج میں آپ کی کیا خدمت کر سکتا ہوں؟`;
    } else {
      textResponse = `Welcome to Al-Brazin Restaurant's exquisite ${cleanBranch} Branch! I am your AI Food Concierge and headwaiter for Table #${customerTable}. It is my absolute pleasure to assist you today. What can I prepare for you?`;
    }
  }
  // 5. SUGGESTIONS / RECOMMENDATIONS
  else if (
    text.includes('suggest') || 
    text.includes('recommend') || 
    text.includes('signature') || 
    text.includes('popular') || 
    text.includes('tasty') || 
    text.includes('special') || 
    text.includes('ماذا تنصح') || 
    text.includes('اقتراح') || 
    text.includes('ترشيح') || 
    text.includes('تنصحني') ||
    text.includes('kuch tasty') ||
    text.includes('recommendation')
  ) {
    if (isArabic) {
      textResponse = `بصفتي نادل المائدة الخاص بك، أنصحك بشدة بتجربة طبقنا الشهير "برجر لحم واغيو الفاخر" (69 ريال) أو "ستيك ريب آي بريستيجينو" المطهو بعناية (159 ريال). وللمقبلات، يعد "الروبيان الحار" (49 ريال) خياراً رائعاً. وللتحلية، "كعكة البستاشيو سينسيشن" (45 ريال) هي تحفة فنية لا تُقاوم!`;
    } else if (isHindiUrdu) {
      textResponse = `میں آپ کو ہمارے مشہور "Wagyu Beef Burger" (69 SAR) یا "Ribeye Steak" (159 SAR) کھانے کی انتہائی سفارش کرتا ہوں۔ یہ بہت لذیذ ہیں!`;
    } else {
      textResponse = `As your personal food concierge, I highly recommend our signature Wagyu Beef Burger (69 SAR), crafted with premium Wagyu beef, or our melt-in-your-mouth Prestigino Ribeye Steak (159 SAR). For starters, our Spicy Shrimp (49 SAR) is a guest favorite. For dessert, the Pistachio Sensation Cake (45 SAR) is an absolute masterpiece! What may I prepare for you?`;
    }
  }
  // 6. INGREDIENTS / DIETARY / DETAILS
  else if (
    text.includes('ingredient') || 
    text.includes('calories') || 
    text.includes('gluten') || 
    text.includes('allergy') || 
    text.includes('spicy') || 
    text.includes('vegetarian') ||
    text.includes('حساسية') ||
    text.includes('مكونات') ||
    text.includes('سعر') ||
    text.includes('حرارية')
  ) {
    if (isArabic) {
      textResponse = `جميع مكونات أطباقنا في مطعم البرازين طبيعية، عضوية، ويتم اختيارها بعناية فائقة لتلائم أعلى معايير الجودة. روبيان الحار يحتوي على السمسم والفلفل الحار، وبطاطس الكمأة نباتية تماماً ومغطاة بجبن البارميزان الفاخر. إذا كان لديك أي حساسية طعام محددة، أخبرني فوراً لأضمن سلامة وجبتك!`;
    } else {
      textResponse = `All ingredients at Al-Brazin are 100% premium, organic, and sourced to meet elite culinary standards. Our Spicy Shrimp contains sesame seeds and rich chili maple-glaze, while our Truffle Fries are completely vegetarian with grated Parmesan. If you have any specific allergies or dietary requirements, please let me know so I can coordinate with the kitchen!`;
    }
  }
  // 7. DRINKS / BEVERAGES
  else if (
    text.includes('drink') || 
    text.includes('drinks') || 
    text.includes('beverage') || 
    text.includes('beverages') || 
    text.includes('juice') || 
    text.includes('soda') || 
    text.includes('water') || 
    text.includes('mojito') || 
    text.includes('espresso') || 
    text.includes('coffee') || 
    text.includes('gold') || 
    text.includes('مشروب') || 
    text.includes('مشروبات') || 
    text.includes('عصير') || 
    text.includes('قهوة') || 
    text.includes('اسبريسو')
  ) {
    if (isArabic) {
      textResponse = `نقدم مجموعة رائعة من المشروبات الفاخرة: "ليمون نعناع موهيتو" المنعش (18 ريال)، ومزيج "البرازين الذهبي الفوار" مع الذهب القابل للأكل عيار 24 (24 ريال)، و"إسبريسو مزدوج" قوي وغني (15 ريال). ما المشروب الذي تفضله؟`;
    } else if (isHindiUrdu) {
      textResponse = `ہمارے پاس بہترین مشروبات دستیاب ہیں: "Limon Mint Mojito" (18 SAR)، "Saudi Sparkling Gold" (24 SAR) اور کلاسک "Double Espresso" (15 SAR)۔ آپ کو کیا پسند آئے گا؟`;
    } else {
      textResponse = `We offer exquisite beverages: our refreshing Limon Mint Mojito (18 SAR), our luxurious Saudi Sparkling Gold mocktail infused with edible 24-karat gold flakes (24 SAR), and our bold, rich Double Espresso (15 SAR). Which drink would you like to enjoy?`;
    }
  }
  // 8. DEFAULT HELP
  else {
    if (isArabic) {
      textResponse = `أنا في خدمتك دائماً! يمكنني اقتراح أطباقنا الفاخرة، الإجابة عن مكونات ومحتوى السعرات الحرارية، إدارة سلتك بالكامل، وتقديم طلبك مباشرة للمطبخ. ما الذي ترغب في القيام به الآن؟`;
    } else if (isHindiUrdu) {
      textResponse = `میں آپ کی خدمت کے لیے تیار ہوں! میں کھانے تجویز کر سکتا ہوں، آپ کے کارٹ کو سنبھال سکتا ہوں اور آپ کا آرڈر کچن میں بھیج سکتا ہوں۔`;
    } else {
      textResponse = `I am at your service! I can suggest our chef's signature dishes, answer ingredient or calorie questions, manage your digital cart, and submit your order directly to our kitchen. What can I assist you with right now?`;
    }
  }

  return {
    response: textResponse,
    updatedCart,
    toolCallTriggered,
    orderPlacedSignal,
    createdOrder
  };
}

// 6. AI Waiter Conversation Engine with Tool Calling and SSE Streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, cart, branchId, tableNumber, area } = req.body;

    const branch = BRANCHES.find(b => b.id === branchId) || BRANCHES[0];
    const customerArea = area || 'Open';
    const customerTable = tableNumber || '10';
    const cacheKey = `${branch.id}_${customerTable}_${customerArea}`;

    // Set streaming headers to support real-time token delivery
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Retrieve system instructions (always generated dynamically to ensure up-to-date cart/menu state and instant hot reload)
    let systemInstruction = `
You are "Al-Brazin AI Waiter", a premium virtual headwaiter and expert food concierge for the "Al-Brazin Restaurants & Co." luxury multi-branch chain.
The branches are:
- Golden Restaurant (in Riyadh)
- Diamond Restaurant
- Prestigino Restaurant
- Mirage Restaurant
- Al Rashid Al Khobar Restaurant

Your tone is extremely warm, polished, hospitable, and highly attentive—equal to a Michelin-star waiter.

Core Directives for a User-Friendly, Human-to-Human Conversation:
1. Support English, Arabic (العربية), and Urdu/Hindi (اردو/हिंदी). Respond fluently and naturally in the language the customer greets you with.
2. Keep responses friendly, elegant, and natural—just like a high-end human waiter would talk at a luxury restaurant. Avoid robotic output, long boilerplate headers, or excessive lists.
3. MULTI-ITEM/CATEGORY COVERAGE: If a customer asks about multiple items or multiple categories (e.g., drinks, appetizers, AND shrimp), you MUST address ALL parts of their request in your response one by one. For example, if they ask for Mojito, an appetizer, and shrimp, talk about the Limon Mint Mojito, the Truffle Parmesan Fries, AND the Spicy Shrimp appetizer. Never ignore any items or focus only on one item!
4. AUTOMATIC CART ADDITION: Whenever a customer says they want an item, agrees to order, or says something like "one Mojito for me", "I will take a Wagyu burger", "add Spicy Shrimp", "can I get a Mojito", "give me one espresso", you MUST immediately call the "updateCart" tool with the exact menu item name and quantity to add it to their digital cart.
5. POST-ADDITION EXPLANATIONS: After adding an item to the cart via updateCart, warmly confirm what has been added and immediately ask the customer: "What next food or drink would you like to add to your cart?" to keep the conversation continuous, smooth, and interactive.
6. ORDER SUMMARY LISTING: When the customer wants to check out, view their bill, or review their pending order, list their cart items and the grand total beautifully, and ask for confirmation.
7. DIRECT ORDER PLACEMENT: If the customer confirms their order or says "Okay, this is fine", "Looks good", "Yes", "Confirm", "place it", "yep", "طعم", "تأكيد", or any verbal approval of their cart, you MUST call the "placeOrder" tool immediately to send the order to our Al-Brazin chefs in the kitchen.
8. Rely ONLY on the menu items provided below. Do not recommend or describe dishes that are not on this exact list.
9. Be an expert on calories, dietary options (vegetarian, spicy), flavor profiles, and allergen questions based strictly on the ingredients.
10. CRITICAL AVAILABILITY CHECK: If an item in the Menu Dataset has isAvailable: false, it is OUT OF STOCK. If the customer tries to order it, you MUST politefully explain that it is currently unavailable or sold out at this branch, and warmly recommend a delicious alternative that is in stock. Do NOT add any out-of-stock items to the cart.
11. STRICT AL-BRAZIN BRAND IDENTITY: Always represent the elite "Al-Brazin Restaurant Group" or "Al-Brazin Restaurant". When greeting, say "Welcome to Al-Brazin's [Branch] Branch" (e.g. Al-Brazin's Diamond Branch). NEVER refer to yourself under the sole name "Diamond Restaurant" or pretend to be an independent entity.
12. BALANCED CONCISENESS: Keep answers elegant, specific, and natural. Keep text responses to 1-3 sentences when greeting or confirming, but ensure you give a complete and helpful answer that addresses every requested dish or drink thoroughly.

Menu Dataset (Your Source of Truth):
${getMenuString()}

Guest's Current Context:
- Branch: ${branch.name}
- Table Number: ${customerTable}
- Section: ${customerArea}

Your Cart State Right Now:
${JSON.stringify(cart, null, 2)}
`;

    // Map client-side message list to Gemini content parts
    // MUST strictly alternate user -> model -> user -> model.
    const cleanMessages: any[] = [];
    messages.forEach((m: any) => {
      if (!m.text || !m.text.trim()) return; // skip empty messages
      const role = m.sender === 'user' ? 'user' : 'model';
      
      if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role === role) {
        // Merge consecutive messages of the same role
        cleanMessages[cleanMessages.length - 1].parts[0].text += "\n" + m.text;
      } else {
        cleanMessages.push({
          role,
          parts: [{ text: m.text }]
        });
      }
    });

    // Fallback: If cleanMessages is empty, we must provide a starter user message
    if (cleanMessages.length === 0) {
      cleanMessages.push({
        role: 'user',
        parts: [{ text: 'Hello' }]
      });
    }

    // Ensure the message sequence starts with 'user'. If it starts with 'model', prepend a dummy user greeting
    if (cleanMessages[0].role === 'model') {
      cleanMessages.unshift({
        role: 'user',
        parts: [{ text: 'Hi' }]
      });
    }

    // Declare updateCart tool schema
    const updateCartTool = {
      name: "updateCart",
      description: "Updates items in the customer's cart. Use this when the user asks to add, remove, or set quantities of food or drinks.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            description: "List of item changes to perform in the cart.",
            items: {
              type: Type.OBJECT,
              properties: {
                itemName: {
                  type: Type.STRING,
                  description: "The EXACT name of the menu item (e.g. 'Spicy Shrimp', 'Wagyu Beef Burger', 'Pistachio Sensation Cake', 'Limon Mint Mojito').",
                },
                quantity: {
                  type: Type.INTEGER,
                  description: "The quantity. Must be a positive integer.",
                },
                action: {
                  type: Type.STRING,
                  description: "Whether to 'add' this quantity, 'remove' this quantity, or 'set' the absolute quantity.",
                  enum: ["add", "remove", "set"],
                }
              },
              required: ["itemName", "quantity", "action"]
            }
          },
          explanation: {
            type: Type.STRING,
            description: "A short, elegant and warm response explaining what you changed in the cart and recommending an accompaniment or stating the update."
          }
        },
        required: ["items", "explanation"]
      }
    };

    // Declare placeOrder tool schema
    const placeOrderTool = {
      name: "placeOrder",
      description: "Saves and submits the current cart items as a finalized order to the kitchen. Call this when the customer verbally confirms they are ready to order, want to submit/confirm their order, or says yes/okay to placing the order.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          explanation: {
            type: Type.STRING,
            description: "A warm, high-end greeting confirming that the order has been placed and sent to our Al-Brazin chefs in the kitchen."
          }
        },
        required: ["explanation"]
      }
    };

    // Invoke Gemini model with Streaming
    let responseStream;
    let textResponse = '';
    let accumulatedFunctionCalls: any[] = [];

    try {
      responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: cleanMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: [{ functionDeclarations: [updateCartTool, placeOrderTool] }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      // Parse the stream as it flows
      for await (const chunk of responseStream) {
        if (chunk.text) {
          textResponse += chunk.text;
          // Stream text chunk instantly to client
          res.write(`event: text\ndata: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          accumulatedFunctionCalls.push(...chunk.functionCalls);
        }
      }
    } catch (apiError: any) {
      console.warn("Gemini API connection failed, initiating fallback agent:", apiError.message || apiError);
      const userLastMessage = messages[messages.length - 1]?.text || "Hello";
      const fallbackResult = runFallbackAgent(userLastMessage, cart, branch.name, customerTable, branch.id, customerArea);
      
      res.write(`event: text\ndata: ${JSON.stringify({ text: fallbackResult.response })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ 
        response: fallbackResult.response, 
        updatedCart: fallbackResult.updatedCart, 
        toolCallTriggered: fallbackResult.toolCallTriggered,
        orderPlacedSignal: fallbackResult.orderPlacedSignal,
        createdOrder: fallbackResult.createdOrder
      })}\n\n`);
      res.end();
      return;
    }

    let updatedCart = [...cart];
    let toolCallTriggered = false;
    let orderPlacedSignal = false;
    let createdOrder: any = null;

    // Execute tool call if requested by model at end of stream
    if (accumulatedFunctionCalls.length > 0) {
      const call = accumulatedFunctionCalls[0];
      if (call.name === 'updateCart' && call.args) {
        toolCallTriggered = true;
        const args: any = call.args;
        const changes = args.items || [];
        textResponse = args.explanation || 'I have updated your cart.';

        // Stream final tool response to the client
        res.write(`event: text\ndata: ${JSON.stringify({ text: textResponse, clearFirst: true })}\n\n`);

        // Apply changes to the cart
        changes.forEach((change: any) => {
          let menuItem = menuList.find(m => m.name.toLowerCase() === change.itemName.toLowerCase());
          if (!menuItem) {
            // Fuzzy match: check if the menu item name contains the requested item name, or vice versa
            const changeLower = change.itemName.toLowerCase();
            menuItem = menuList.find(m => {
              const menuLower = m.name.toLowerCase();
              return menuLower.includes(changeLower) || changeLower.includes(menuLower);
            });
          }
          if (!menuItem) {
            // Secondary keyword match
            const changeLower = change.itemName.toLowerCase();
            menuItem = menuList.find(m => {
              const menuLower = m.name.toLowerCase();
              if (changeLower.includes('shrimp') && menuLower.includes('shrimp')) return true;
              if (changeLower.includes('mojito') && menuLower.includes('mojito')) return true;
              if (changeLower.includes('espresso') && menuLower.includes('espresso')) return true;
              if (changeLower.includes('burger') && menuLower.includes('burger')) return true;
              if (changeLower.includes('steak') && menuLower.includes('steak')) return true;
              if (changeLower.includes('ribeye') && menuLower.includes('ribeye')) return true;
              if (changeLower.includes('fries') && menuLower.includes('fries')) return true;
              if (changeLower.includes('cake') && menuLower.includes('cake')) return true;
              if (changeLower.includes('pudding') && menuLower.includes('pudding')) return true;
              if (changeLower.includes('salmon') && menuLower.includes('salmon')) return true;
              if (changeLower.includes('calamari') && menuLower.includes('calamari')) return true;
              return false;
            });
          }

          if (menuItem) {
            // Block adding out-of-stock items via AI tool execution
            if (menuItem.isAvailable === false && (change.action === 'add' || change.action === 'set' && change.quantity > 0)) {
              textResponse = `I'm sorry, but our premium "${menuItem.name}" is currently sold out today. I cannot add it to your cart, but I would be delighted to recommend another signature alternative from our Al-Brazin menu.`;
              res.write(`event: text\ndata: ${JSON.stringify({ text: textResponse, clearFirst: true })}\n\n`);
              return;
            }

            const existingIndex = updatedCart.findIndex(item => item.menuItemId === menuItem.id);
            
            if (change.action === 'add') {
              if (existingIndex !== -1) {
                updatedCart[existingIndex].quantity += change.quantity;
              } else {
                updatedCart.push({
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: change.quantity
                });
              }
            } else if (change.action === 'remove') {
              if (existingIndex !== -1) {
                updatedCart[existingIndex].quantity -= change.quantity;
                if (updatedCart[existingIndex].quantity <= 0) {
                  updatedCart.splice(existingIndex, 1);
                }
              }
            } else if (change.action === 'set') {
              if (existingIndex !== -1) {
                if (change.quantity <= 0) {
                  updatedCart.splice(existingIndex, 1);
                } else {
                  updatedCart[existingIndex].quantity = change.quantity;
                }
              } else if (change.quantity > 0) {
                updatedCart.push({
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  price: menuItem.price,
                  quantity: change.quantity
                });
              }
            }
          }
        });
      } else if (call.name === 'placeOrder' && call.args) {
        toolCallTriggered = true;
        orderPlacedSignal = true;
        const args: any = call.args;
        textResponse = args.explanation || 'Perfect! I have submitted your order to the kitchen. You can see your order receipt and tracking status on your screen now.';

        // Stream final tool response to the client
        res.write(`event: text\ndata: ${JSON.stringify({ text: textResponse, clearFirst: true })}\n\n`);

        if (cart.length > 0) {
          const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          createdOrder = {
            id: 'ord_' + Date.now(),
            branchId: branch.id,
            branchName: branch.name,
            tableNumber: customerTable,
            area: customerArea,
            items: cart,
            totalAmount,
            status: 'Pending',
            paymentMethod: 'Counter',
            createdAt: new Date().toISOString(),
            notes: ''
          };
          ordersList.unshift(createdOrder);
          persist('orders', ordersList);
          emitEvent('order:new', createdOrder);
          updatedCart = []; // clear cart upon successful order placement
        }
      }
    }

    // Terminate stream with final execution context
    res.write(`event: done\ndata: ${JSON.stringify({ 
      response: textResponse, 
      updatedCart, 
      toolCallTriggered,
      orderPlacedSignal,
      createdOrder
    })}\n\n`);
    res.end();

  } catch (error: any) {
    console.warn('Gemini API Streaming Warning:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || 'Streaming interaction error' })}\n\n`);
    res.end();
  }
});


// ---------------- EXPRESS VITE BOOTSTRAP ----------------

async function startServer() {
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    (typeof __filename !== 'undefined' && (__filename.includes('dist') || __filename.includes('server.cjs'))) ||
    (!fs.existsSync(path.join(process.cwd(), 'server.ts')) && fs.existsSync(path.join(process.cwd(), 'dist/index.html')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  io = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true }
  });

  io.on('connection', (socket) => {
    // Clients don't need to send anything — they just listen for broadcast
    // events (order:new, order:updated, waiterCall:new, waiterCall:updated).
    socket.on('disconnect', () => {});
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Restaurant Server running at http://0.0.0.0:${PORT}`);
    console.log(`Real-time (Socket.IO) enabled. Data persisted to: ${DATA_DIR}`);
  });
}

startServer();
