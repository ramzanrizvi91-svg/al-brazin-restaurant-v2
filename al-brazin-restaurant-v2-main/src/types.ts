export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number; // in SAR
  ingredients: string[];
  calories: number;
  taste: string;
  image: string;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  isPopular?: boolean;
  isAvailable?: boolean; // Toggle item availability (out of stock/disabled)
  branchIds?: string[];  // Restrict to specific branch IDs. If empty or null, global.
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Table {
  id: string;
  number: string;
  area: string;
  branchId: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  area: string;
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served';
  paymentMethod: 'Counter' | 'ApplePay' | 'Mada' | 'CreditCard';
  createdAt: string; // ISO String
  notes?: string;
  customerPhone?: string;
  discountAmount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
}

export interface LoyaltyAccount {
  phone: string;
  name?: string;
  points: number;          // current redeemable balance
  lifetimePoints: number;  // never decreases; used for tier calculation
  totalSpent: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  phone: string;
  orderId?: string;
  type: 'earn' | 'redeem' | 'adjust';
  points: number; // positive for earn/adjust-up, negative for redeem
  note?: string;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  branchId: string | null;
  label: string;
  details: string;
}

export interface WaiterCall {
  id: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  area: string;
  status: 'Pending' | 'Addressed';
  createdAt: string;
}

export interface SalesAnalytics {
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  revenuePerBranch: { branchName: string; revenue: number }[];
  peakHours: { hour: string; orderCount: number }[];
  orderTrends: { date: string; revenue: number; orderCount: number }[];
  averageRating?: number;
  aiSatisfactionScore?: number;
  aiHighlights?: string[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  branchId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

