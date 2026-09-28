import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { logoutLocalCleanupMessage, logoutServerFailureMessage } from "@/lib/auth-recovery";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Web platform: use cookie-based auth, fetch user from API
      if (Platform.OS === "web") {
        console.log("[useAuth] Web platform: fetching user from API...");
        const apiUser = await Api.getMe();
        console.log("[useAuth] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          // Cache user info in localStorage for faster subsequent loads
          await Auth.setUserInfo(userInfo);
          console.log("[useAuth] Web user set from API:", userInfo);
        } else {
          console.log("[useAuth] Web: No authenticated user from API");
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // Native platform: use token-based auth
      console.log("[useAuth] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[useAuth] No session token, setting user to null");
        setUser(null);
        return;
      }

      // Use cached user info for native (token validates the session)
      const cachedUser = await Auth.getUserInfo();
      console.log("[useAuth] Cached user:", cachedUser);
      if (cachedUser) {
        console.log("[useAuth] Using cached user info");
        setUser(cachedUser);
      } else {
        console.log("[useAuth] No cached user, setting user to null");
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, []);

  const logout = useCallback(async () => {
    let serverLogoutError: Error | null = null;
    let cleanupError: Error | null = null;

    try {
      await Api.logout();
    } catch (err) {
      // Local sign-out must still proceed when the server is unavailable, but the
      // caller needs truthful feedback that remote cleanup was not confirmed.
      serverLogoutError = new Error(logoutServerFailureMessage, { cause: err });
    }

    let sessionTokenError: unknown = null;
    let userInfoError: unknown = null;
    try {
      await Auth.removeSessionToken();
    } catch (err) {
      sessionTokenError = err;
    }
    try {
      await Auth.clearUserInfo();
    } catch (err) {
      userInfoError = err;
    }
    const localCleanupMessage = logoutLocalCleanupMessage(Boolean(sessionTokenError), Boolean(userInfoError));
    if (localCleanupMessage) {
      cleanupError = new Error(localCleanupMessage, {
        cause: sessionTokenError ?? userInfoError,
      });
    }
    setUser(null);
    setError(cleanupError ?? serverLogoutError);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      if (Platform.OS === "web") {
        await fetchUser();
        return;
      }

      try {
        const cachedUser = await Auth.getUserInfo();
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
          return;
        }
      } catch {
        // A corrupt or unavailable cache should not strand startup; fetchUser handles the session fallback.
      }

      await fetchUser();
    };

    void initializeAuth();
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}
