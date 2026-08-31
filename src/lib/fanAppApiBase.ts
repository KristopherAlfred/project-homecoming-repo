/**
 * Base URL for the athlete's own fan-app content/analytics API.
 *
 * There is deliberately NO default here. A hardcoded fallback would serve one
 * specific athlete's newsletters, videos, photos and metrics to every account,
 * so when nothing is configured we throw and the UI renders its
 * "not connected yet" empty state instead of someone else's data.
 */
export const FAN_APP_API_NOT_CONFIGURED = "FAN_APP_API_NOT_CONFIGURED";

export function resolveFanAppApiBase(): string {
  const raw = import.meta.env.VITE_DAME_BIO_API_URL;
  const base = typeof raw === "string" ? raw.trim() : "";
  return base.replace(/\/+$/, "");
}

export function hasFanAppApi(): boolean {
  return resolveFanAppApiBase().length > 0;
}

export function requireFanAppApiBase(): string {
  const base = resolveFanAppApiBase();
  if (!base) {
    const error = new Error("Fan app API is not connected for this athlete yet");
    error.name = FAN_APP_API_NOT_CONFIGURED;
    throw error;
  }
  return base;
}
