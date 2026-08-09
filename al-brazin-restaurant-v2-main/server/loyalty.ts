// ==========================================================================
// loyalty.ts — Loyalty points program rules
// ==========================================================================
// Identification: by phone number (no full customer account system needed).
// Earning: 1 point per 1 SAR spent, multiplied by the customer's tier bonus.
// Redeeming: every 10 points = 1 SAR discount at checkout.
// Tiers are based on LIFETIME points earned (never decrease on redemption).
// ==========================================================================

export const POINTS_PER_SAR = 1;
export const POINT_VALUE_SAR = 0.1; // 10 points = 1 SAR

export const TIER_THRESHOLDS = {
  Silver: 500,
  Gold: 2000,
} as const;

export const TIER_MULTIPLIER: Record<'Bronze' | 'Silver' | 'Gold', number> = {
  Bronze: 1,
  Silver: 1.1,
  Gold: 1.25,
};

export function computeTier(lifetimePoints: number): 'Bronze' | 'Silver' | 'Gold' {
  if (lifetimePoints >= TIER_THRESHOLDS.Gold) return 'Gold';
  if (lifetimePoints >= TIER_THRESHOLDS.Silver) return 'Silver';
  return 'Bronze';
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

export function isValidPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return cleaned.length >= 8 && cleaned.length <= 16;
}
