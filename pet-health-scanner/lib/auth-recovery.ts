export const logoutServerFailureMessage =
  "You were signed out on this device, but the server could not confirm session cleanup. Try signing in again later if needed.";

export const logoutLocalFailureMessage =
  "The session could not be fully cleared from this device. Close and reopen the app, then try signing out again.";

export const logoutLocalPartialFailureMessage =
  "You were signed out in the app, but some local session data could not be cleared. Close and reopen the app, then try signing out again.";

export function logoutLocalCleanupMessage(sessionTokenFailed: boolean, userInfoFailed: boolean): string | null {
  if (!sessionTokenFailed && !userInfoFailed) return null;
  return sessionTokenFailed !== userInfoFailed
    ? logoutLocalPartialFailureMessage
    : logoutLocalFailureMessage;
}
