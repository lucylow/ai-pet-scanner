export type NetworkStateLike = { isConnected?: boolean | null; isInternetReachable?: boolean | null };

export function classifyNetworkState(state: NetworkStateLike): "offline" | "online" | "checking" {
  if (state.isInternetReachable === null || state.isInternetReachable === undefined) return "checking";
  return state.isInternetReachable === false || state.isConnected === false ? "offline" : "online";
}

export function networkRetryHint(isOffline: boolean): string {
  return isOffline
    ? "You appear to be offline. The scan will stay saved on this device; reconnect before trying a remote review."
    : "A connection is available, but the remote service may still be unavailable. You can try again safely.";
}

export const offlineBannerCopy = "Saved profiles, observations, and unfinished drafts remain available on this device. Remote review and subscription verification will wait until you reconnect.";
export const offlineBannerDismissHint = "Hides this notice until the connection changes again";

export function connectionLastCheckedCopy(timestamp: number, now = Date.now(), isRefreshing = false): string {
  if (isRefreshing) return "Checking connection now";
  const elapsedMinutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  return elapsedMinutes === 0 ? "Last checked just now" : `Last checked ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
}

export function connectionIndicatorCopy(state: "offline" | "online" | "checking"): { label: string; hint: string } {
  if (state === "offline") return { label: "Offline — copy available", hint: "Remote sharing may fail. Your reviewed text remains on this screen and can be copied locally." };
  if (state === "checking") return { label: "Checking connection", hint: "Wait for the connection check before relying on remote sharing." };
  return { label: "Connection available", hint: "Remote sharing can be attempted, but availability is not guaranteed." };
}
