export type QueueItem = { id: string; scanId: string; uri: string; attempts: number; status: "pending" | "uploading" | "failed" };
const queue = new Map<string, QueueItem>();
export function enqueue(item: QueueItem) { queue.set(item.id, item); }
export function pending() { return [...queue.values()].filter((item) => item.status === "pending"); }
export function markUploading(id: string) { const item = queue.get(id); if (item) item.status = "uploading"; }
export function markFailed(id: string) { const item = queue.get(id); if (item) { item.status = "failed"; item.attempts += 1; } }
export function removeQueued(id: string) { queue.delete(id); }

export interface AnalyticsEvent { name: string; props?: Record<string, string | number | boolean>; }
let sink: ((event: AnalyticsEvent) => void) | null = null;
export function configureAnalytics(next: (event: AnalyticsEvent) => void) { sink = next; }
export function track(name: string, props?: AnalyticsEvent["props"]) { sink?.({ name, props }); }
export function scrub(value: string) { return value.replace(/https?:\/\/[^ ]+/g, "[url]").slice(0, 200); }
