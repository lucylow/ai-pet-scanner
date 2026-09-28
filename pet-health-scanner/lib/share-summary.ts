import { Share } from "react-native";
import type { ScanResult } from "@/lib/pet-health";
import { formatScanSummary, formatVeterinaryVisitSummary, type SummaryLabels } from "@/lib/share-summary-format";

export { formatScanSummary, formatVeterinaryVisitSummary } from "@/lib/share-summary-format";

export async function shareScanSummary(scan: ScanResult, labels?: SummaryLabels) {
  return Share.share({ title: `Pet observation for ${scan.petName}`, message: formatScanSummary(scan, labels) });
}

export async function shareVeterinaryVisitSummary(scan: ScanResult, reviewedMessage?: string, labels?: SummaryLabels) {
  return Share.share({ title: `Veterinary visit summary for ${scan.petName}`, message: reviewedMessage ?? formatVeterinaryVisitSummary(scan, {}, labels) });
}
