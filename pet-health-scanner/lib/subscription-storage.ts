import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { SubscriptionSnapshot } from "@/lib/subscription-status";

const KEY = "pet-health-scanner.subscription-snapshot";

export async function saveSubscriptionSnapshot(snapshot: SubscriptionSnapshot): Promise<boolean> {
  const value = JSON.stringify(snapshot);
  if (Platform.OS === "web") {
    try {
      if (!globalThis.localStorage) return false;
      globalThis.localStorage.setItem(KEY, value);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
    return true;
  } catch {
    return false;
  }
}

export async function loadSubscriptionSnapshot(): Promise<SubscriptionSnapshot | null> {
  let value: string | null = null;
  try {
    value = Platform.OS === "web" ? globalThis.localStorage?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || !("state" in parsed) || !("refreshedAt" in parsed)) return null;
    return parsed as SubscriptionSnapshot;
  } catch {
    return null;
  }
}

export async function clearSubscriptionSnapshot(): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      if (!globalThis.localStorage) return false;
      globalThis.localStorage.removeItem(KEY);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await SecureStore.deleteItemAsync(KEY);
    return true;
  } catch {
    return false;
  }
}
