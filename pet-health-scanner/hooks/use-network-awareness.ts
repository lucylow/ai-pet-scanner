import * as Network from "expo-network";
import { useCallback, useEffect, useState } from "react";
import { classifyNetworkState, networkRetryHint, type NetworkStateLike } from "@/lib/network-awareness";

export type { NetworkStateLike } from "@/lib/network-awareness";
export { classifyNetworkState, networkRetryHint } from "@/lib/network-awareness";

export type NetworkAwareness = {
  isOffline: boolean;
  isChecking: boolean;
  label: string;
  retryHint: string;
  lastCheckedAt: number;
  isRefreshing: boolean;
  refreshError: boolean;
  refresh: () => Promise<void>;
};

export function useNetworkAwareness(): NetworkAwareness {
  const state = Network.useNetworkState();
  const classification = classifyNetworkState(state as NetworkStateLike);
  const isChecking = classification === "checking";
  const isOffline = classification === "offline";
  const [lastCheckedAt, setLastCheckedAt] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      await Network.getNetworkStateAsync();
      setLastCheckedAt(Date.now());
    } catch (error) {
      setRefreshError(true);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => { setLastCheckedAt(Date.now()); }, [classification]);
  return {
    isOffline,
    isChecking,
    label: isChecking ? "Checking connection" : isOffline ? "Offline" : "Online",
    retryHint: networkRetryHint(isOffline),
    lastCheckedAt,
    isRefreshing,
    refreshError,
    refresh,
  };
}
