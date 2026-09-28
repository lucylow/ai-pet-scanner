import type { SubscriptionState } from "@/lib/monetization";
import { refreshEntitlements } from "@/lib/subscription-api";
import { loadSubscriptionSnapshot, saveSubscriptionSnapshot } from "@/lib/subscription-storage";
import { subscriptionStorageFailureMessage } from "@/lib/subscription-recovery";
import { markSnapshotStale, type SubscriptionSnapshot } from "@/lib/subscription-status";

export type RefreshOutcome = { kind: "verified"; snapshot: SubscriptionSnapshot; message?: string } | { kind: "cached"; snapshot: SubscriptionSnapshot | null; message: string } | { kind: "signed_out"; snapshot: SubscriptionSnapshot | null; message: string };

export async function refreshSubscriptionForSession(options: { token?: string | null; endpoint: string; fetchImpl?: typeof fetch }): Promise<RefreshOutcome> {
  const cached = await loadSubscriptionSnapshot();
  if (!options.token) return { kind: "signed_out", snapshot: cached ? markSnapshotStale(cached) : null, message: "Sign in to verify subscription access. Cached status is display-only." };
  try {
    const state: SubscriptionState = await refreshEntitlements(options.token, { endpoint: options.endpoint, fetchImpl: options.fetchImpl });
    const snapshot: SubscriptionSnapshot = { state, refreshedAt: new Date().toISOString(), source: "server", stale: false };
    const persisted = await saveSubscriptionSnapshot(snapshot);
    return { kind: "verified", snapshot, message: persisted ? undefined : subscriptionStorageFailureMessage };
  } catch {
    return { kind: "cached", snapshot: cached ? markSnapshotStale(cached) : null, message: "We could not verify subscription status. Your cached status remains display-only." };
  }
}
