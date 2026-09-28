import type { SubscriptionState } from "@/lib/monetization";

export type SubscriptionSnapshot = {
  state: SubscriptionState;
  refreshedAt: string;
  source: "server" | "cached" | "default";
  stale: boolean;
};

export function subscriptionStatusCopy(snapshot: SubscriptionSnapshot) {
  if (snapshot.stale) return "Subscription status may be out of date. Refresh when connected.";
  if (snapshot.state.plan === "free") return "Free plan · Basic observation access remains available.";
  if (snapshot.state.willCancel) return `${snapshot.state.plan.toUpperCase()} plan · Scheduled to end after the current period.`;
  if (snapshot.state.renewsAt) return `${snapshot.state.plan.toUpperCase()} plan · Renews ${new Date(snapshot.state.renewsAt).toLocaleDateString()}.`;
  return `${snapshot.state.plan.toUpperCase()} plan · Active access verified.`;
}

export function markSnapshotStale(snapshot: SubscriptionSnapshot, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000): SubscriptionSnapshot {
  return { ...snapshot, stale: now - new Date(snapshot.refreshedAt).getTime() > maxAgeMs };
}
