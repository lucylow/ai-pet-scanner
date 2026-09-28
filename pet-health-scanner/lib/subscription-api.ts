import type { SubscriptionState } from "@/lib/monetization";
import { subscriptionStateSchema } from "../shared/pet-scanner-contracts";

export type SubscriptionRefreshErrorCode = "UNAUTHORIZED" | "NETWORK" | "SERVER" | "INVALID_RESPONSE";

export class SubscriptionRefreshError extends Error {
  constructor(public readonly code: SubscriptionRefreshErrorCode, message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "SubscriptionRefreshError";
  }
}

export async function refreshEntitlements(token: string | null, options: { endpoint: string; fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<SubscriptionState> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(options.endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, credentials: token ? undefined : "include", signal: controller.signal });
    if (response.status === 401 || response.status === 403) throw new SubscriptionRefreshError("UNAUTHORIZED", "Sign in again to refresh subscription status.", false);
    if (!response.ok) throw new SubscriptionRefreshError("SERVER", "Subscription status is temporarily unavailable.", response.status >= 500);
    const parsed = subscriptionStateSchema.safeParse(await response.json());
    if (!parsed.success) throw new SubscriptionRefreshError("INVALID_RESPONSE", "Subscription status was invalid.", false);
    return parsed.data as SubscriptionState;
  } catch (error) {
    if (error instanceof SubscriptionRefreshError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new SubscriptionRefreshError("NETWORK", "Refresh timed out. Your cached status is unchanged.", true);
    throw new SubscriptionRefreshError("NETWORK", "Check your connection. Your cached status is unchanged.", true);
  } finally {
    clearTimeout(timeout);
  }
}
