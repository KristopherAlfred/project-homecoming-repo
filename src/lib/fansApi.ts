import { requireFanAppApiBase } from "./fanAppApiBase";
export type FanContact = {
  email: string;
  name: string | null;
  username: string | null;
  phone: string | null;
  auth_provider: string;
  sms_opt_in: boolean;
  points: number;
  created_at: string;
  updated_at: string;
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
  country_name?: string | null;
};

export type FanGeoUpdate = {
  city: string | null;
  region: string | null;
  country_code: string | null;
  country_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type FansListResponse = {
  ok: boolean;
  count: number;
  emailCount: number;
  smsOptIns: number;
  withPhone: number;
  fans: FanContact[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

export async function fetchFansList(): Promise<FansListResponse> {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("Set VITE_ADMIN_EXPORT_SECRET to load live fan emails");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=fans`, {
    headers: { "x-admin-secret": secret },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Fans request failed (${response.status})`);
  }

  const fans = Array.isArray((data as FansListResponse).fans) ? (data as FansListResponse).fans : [];
  return {
    ok: true,
    count: Number((data as FansListResponse).count) || fans.length,
    emailCount: Number((data as FansListResponse).emailCount) || fans.length,
    smsOptIns:
      Number((data as FansListResponse).smsOptIns) ||
      fans.filter((fan) => fan.sms_opt_in).length,
    withPhone:
      Number((data as FansListResponse).withPhone) ||
      fans.filter((fan) => Boolean(fan.phone)).length,
    fans,
  };
}

export async function setFanLocation(email: string, geo: FanGeoUpdate): Promise<void> {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to update fan locations");

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=fans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-secret": secret },
    body: JSON.stringify({ action: "set_location", email, geo }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Location update failed (${response.status})`);
  }
}

export function fanLocationLabel(fan: FanContact): string | null {
  const parts = [fan.city, fan.region, fan.country_name || fan.country_code].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function exportFansCsvUrl() {
  return `${getApiBase()}/api/admin/export?format=csv`;
}

export async function downloadFansCsv() {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to export CSV");

  const response = await fetch(exportFansCsvUrl(), {
    headers: { "x-admin-secret": secret },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `CSV export failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dame-fans-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function formatFanJoined(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fanDisplayName(fan: FanContact) {
  if (fan.name?.trim()) return fan.name.trim();
  if (fan.username?.trim()) return `@${fan.username.trim()}`;
  return fan.email.split("@")[0] || fan.email;
}

export function formatAuthProvider(provider: string) {
  const value = provider.trim().toLowerCase();
  if (value === "google") return "Google";
  if (value === "apple") return "Apple";
  if (value === "phone") return "Phone";
  return "Email";
}
