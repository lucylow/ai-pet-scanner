export type Plan = "free" | "plus" | "pro";
export type Feature = "advancedAI" | "videoScan" | "pdfExport" | "trends" | "familyPets";

export type SubscriptionState = {
  plan: Plan;
  entitlements: Feature[];
  renewsAt?: string;
  willCancel?: boolean;
};

export const FREE_SUBSCRIPTION: SubscriptionState = { plan: "free", entitlements: [] };

export const PRODUCTS = { plusMonthly: "pet_plus_monthly", plusAnnual: "pet_plus_annual", proMonthly: "pet_pro_monthly", proAnnual: "pet_pro_annual" } as const;
export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS];

export type PaywallOffer = {
  productId: string;
  title: string;
  subtitle: string;
  badge?: string;
  monthlyPriceLabel: string;
  annualPriceLabel?: string;
  ctaLabel: string;
};

export type PaywallConfig = {
  id: string;
  title: string;
  offers: PaywallOffer[];
  featureBullets: string[];
  legalText: string;
};

export const DEFAULT_PAYWALL: PaywallConfig = {
  id: "pet-health-plus-v1",
  title: "Support deeper organization",
  offers: [
    { productId: "pet_plus_monthly", title: "Plus", subtitle: "More ways to organize your observations", badge: "Most flexible", monthlyPriceLabel: "Price shown at checkout", ctaLabel: "See Plus details" },
    { productId: "pet_pro_monthly", title: "Pro", subtitle: "Advanced analysis boundaries when available", monthlyPriceLabel: "Price shown at checkout", ctaLabel: "See Pro details" },
  ],
  featureBullets: ["Keep basic observation scans available", "Organize more history and exports", "No diagnosis or medical guarantee is unlocked by payment"],
  legalText: "Plans, pricing, renewals, and cancellation are handled by the platform store. Core safety guidance remains available without a subscription.",
};

export function canUse(feature: Feature, state: SubscriptionState) {
  return state.plan === "pro" || state.plan === "plus" && feature !== "familyPets" || state.entitlements.includes(feature);
}

export function gateFeature(feature: Feature, state: SubscriptionState) {
  const allowed = canUse(feature, state);
  return { allowed, reason: allowed ? undefined : "premium_required" as const };
}

export function billingMessage(code: string) {
  if (code === "user_cancelled") return "Purchase cancelled. Your current access is unchanged.";
  if (code === "network") return "Check your connection and try again.";
  if (code === "verification_failed") return "We could not verify that purchase. No premium access was granted.";
  return "We could not complete the purchase. Your current access is unchanged.";
}
