export type OAuthLaunchFailure = "unsupported" | "open-failed";

export function oauthLaunchErrorMessage(reason: OAuthLaunchFailure): string {
  return reason === "unsupported"
    ? "Sign-in could not start because this device cannot open the secure login link. Check your browser or try again."
    : "Sign-in could not start because the secure login link could not be opened. Check your browser or try again.";
}
