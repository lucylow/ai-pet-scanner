import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeBackButton } from "@/components/safe-back-button";
import { ScreenContainer } from "@/components/screen-container";
import { AsyncActionStatus, Card, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/pet-ui";
import { DEFAULT_PAYWALL } from "@/lib/monetization";
import { getSessionToken } from "@/lib/_core/auth";
import { refreshSubscriptionForSession } from "@/lib/subscription-coordinator";
import { recoverableSubscriptionErrorCopy } from "@/lib/pet-health";

export default function PaywallScreen() {
  const [selected, setSelected] = useState(DEFAULT_PAYWALL.offers[0].productId);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageStatus, setMessageStatus] = useState<"success" | "error">("success");
  const selectedOffer = DEFAULT_PAYWALL.offers.find((offer) => offer.productId === selected) ?? DEFAULT_PAYWALL.offers[0];

  const startCheckout = () => {
    setMessageStatus("error");
    setMessage("Store checkout is not available in this build yet. Basic observation access remains available, and no premium access was granted.");
  };

  const restore = async () => {
    if (restoreBusy) return;
    setMessage(null);
    setRestoreBusy(true);
    try {
      const token = await getSessionToken();
      const outcome = await refreshSubscriptionForSession({ token, endpoint: process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/v1/me/subscription` : "/v1/me/subscription" });
      setMessageStatus(outcome.kind === "verified" ? "success" : "error");
      setMessage(outcome.kind === "verified" ? "Subscription status was verified by the server. Store restoration will change access only after valid store evidence is available." : outcome.message);
    } catch {
      setMessageStatus("error");
      setMessage(recoverableSubscriptionErrorCopy);
    } finally {
      setRestoreBusy(false);
    }
  };

  return <ScreenContainer className="px-5 pt-5"><ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 36 }}><SectionTitle eyebrow="Optional plans">Choose what fits</SectionTitle><Text className="text-base leading-6 text-muted">Pet Health Scanner keeps basic observation, safety guidance, and local history available without a subscription. Premium plans are for additional organization and analysis capacity, not medical certainty.</Text><View style={{ gap: 12 }}>{DEFAULT_PAYWALL.offers.map((offer) => <SecondaryButton key={offer.productId} onPress={() => setSelected(offer.productId)} accessibilityRole="radio" accessibilityLabel={`${offer.title} plan`} accessibilityState={{ selected: selected === offer.productId }} style={{ minHeight: 88, alignItems: "flex-start", padding: 16, backgroundColor: selected === offer.productId ? "#DCE9DF" : "#FFFDF9" }}><View style={{ gap: 4 }}><Text className="text-lg font-bold text-foreground">{offer.title}{offer.badge ? ` · ${offer.badge}` : ""}</Text><Text className="text-sm text-muted">{offer.subtitle}</Text><Text className="text-sm font-semibold text-foreground">{offer.monthlyPriceLabel}</Text></View></SecondaryButton>)}</View><Card tone="sage"><View style={{ gap: 8 }}>{DEFAULT_PAYWALL.featureBullets.map((item) => <Text key={item} className="text-sm leading-5 text-foreground">• {item}</Text>)}</View></Card>{message ? <AsyncActionStatus status={messageStatus} message={message} /> : null}<PrimaryButton accessibilityLabel={`Choose ${selectedOffer.title} plan`} accessibilityHint="Store checkout is unavailable until the platform billing adapter is connected" onPress={startCheckout}><Text className="font-bold text-white">{selectedOffer.ctaLabel}</Text></PrimaryButton><SecondaryButton disabled={restoreBusy} accessibilityLabel="Restore purchases and verify subscription status" accessibilityHint="Checks server-verified subscription status without granting access from local cache" accessibilityState={{ disabled: restoreBusy, busy: restoreBusy }} onPress={restore}><Text className="font-semibold text-foreground">{restoreBusy ? "Checking verification…" : "Restore purchases"}</Text></SecondaryButton><Text className="text-xs leading-4 text-muted">{DEFAULT_PAYWALL.legalText}</Text><SafeBackButton label="Not now" /></ScrollView></ScreenContainer>;
}
