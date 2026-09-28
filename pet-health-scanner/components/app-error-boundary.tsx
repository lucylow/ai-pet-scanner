import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { Card, PrimaryButton } from "@/components/pet-ui";
import { appErrorCopy, appErrorTitle } from "@/lib/pet-health";

export const APP_ERROR_TITLE = appErrorTitle;
export const APP_ERROR_COPY = appErrorCopy;

export type AppErrorBoundaryProps = { children: ReactNode };
export type AppErrorBoundaryState = { hasError: boolean };

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error("Pet Health Scanner render error", error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F7F2E8" }}>
        <Card tone="amber">
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700", color: "#24322C" }}>{APP_ERROR_TITLE}</Text>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ fontSize: 15, lineHeight: 22, color: "#24322C" }}>{APP_ERROR_COPY}</Text>
            <PrimaryButton accessibilityLabel="Try to reload the screen" accessibilityHint="Resets the current screen without deleting local data" onPress={this.reset}>
              <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Try again</Text>
            </PrimaryButton>
          </View>
        </Card>
      </View>
    );
  }
}
