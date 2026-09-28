import type { ProductId } from "@/lib/monetization";
import type { SubscriptionState } from "@/lib/monetization";

export type StoreProduct = { productId: ProductId; localizedPrice: string; priceMicros: number; currencyCode: string };
export type PurchaseResult = { transactionId: string; productId: ProductId; purchasedAt: string; receipt?: string; originalTransactionId?: string };

export interface PurchaseAdapter {
  initialize(): Promise<void>;
  getProducts(ids: ProductId[]): Promise<StoreProduct[]>;
  purchase(productId: ProductId): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult[]>;
  finish(transactionId: string): Promise<void>;
}

let initializedAdapter: PurchaseAdapter | null = null;

export async function initializeBilling(adapter: PurchaseAdapter) {
  if (initializedAdapter === adapter) return;
  await adapter.initialize();
  initializedAdapter = adapter;
}

export async function loadProducts(adapter: PurchaseAdapter, ids: ProductId[]) {
  await initializeBilling(adapter);
  return adapter.getProducts(ids);
}

export async function restorePurchases(adapter: PurchaseAdapter) {
  await initializeBilling(adapter);
  return adapter.restore();
}

export async function finishIfVerified(adapter: PurchaseAdapter, transactionId: string, verified: boolean) {
  if (verified) await adapter.finish(transactionId);
}

export type PurchaseVerification = (purchase: PurchaseResult) => Promise<boolean>;

export type VerifiedPurchaseOutcome =
  | { status: "verified"; purchase: PurchaseResult }
  | { status: "verification_failed"; purchase: PurchaseResult };

/**
 * Keeps the store transaction pending until the server confirms it. A client-side
 * purchase result is never treated as entitlement evidence by itself.
 */
export async function purchaseAndFinishIfVerified(
  adapter: PurchaseAdapter,
  productId: ProductId,
  verify: PurchaseVerification,
): Promise<VerifiedPurchaseOutcome> {
  await initializeBilling(adapter);
  const purchase = await adapter.purchase(productId);
  let verified = false;
  try {
    verified = await verify(purchase);
  } catch {
    verified = false;
  }
  if (!verified) return { status: "verification_failed", purchase };
  await adapter.finish(purchase.transactionId);
  return { status: "verified", purchase };
}

export function mergeEntitlementRefresh(current: SubscriptionState, refreshed: SubscriptionState | null): SubscriptionState {
  if (!refreshed) return current;
  return { ...refreshed, entitlements: [...new Set(refreshed.entitlements)] };
}

export function billingMessage(code: string) {
  if (code === "user_cancelled") return "Purchase cancelled. Your current access is unchanged.";
  if (code === "network") return "Check your connection and try again.";
  if (code === "verification_failed") return "We could not verify that purchase. No premium access was granted.";
  return "We could not complete the purchase. Your current access is unchanged.";
}
